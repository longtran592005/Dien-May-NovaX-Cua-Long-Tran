import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { products as fallbackProducts } from './products.data';

interface ListQuery {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

interface UpsertProductInput {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  brand: string;
  sku?: string;
  stock: number;
  categorySlug: string;
  images?: string[];
}

interface CatalogDbProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  images: Array<{ url: string }>;
  category: { slug: string };
  brand: string;
  rating: number;
  reviewCount: number;
  description: string | null;
  inStock: boolean;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(query: ListQuery) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.pageSize || 20);

    try {
      const where = {
        isActive: true,
        ...(query.q
          ? {
              name: {
                contains: query.q,
                mode: 'insensitive' as const
              }
            }
          : {}),
        ...(query.category
          ? {
              category: {
                slug: query.category
              }
            }
          : {}),
        ...(typeof query.minPrice === 'number' || typeof query.maxPrice === 'number'
          ? {
              price: {
                ...(typeof query.minPrice === 'number' ? { gte: query.minPrice } : {}),
                ...(typeof query.maxPrice === 'number' ? { lte: query.maxPrice } : {})
              }
            }
          : {})
      };

      const [items, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            images: true,
            category: true
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        this.prisma.product.count({ where })
      ]);

      if (total === 0) {
        return this.getFallbackList(query, page, pageSize);
      }

      const typedItems = items as unknown as CatalogDbProduct[];

      return {
        items: typedItems.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          price: item.price,
          originalPrice: item.originalPrice || undefined,
          discount: item.discount || undefined,
          images: item.images.length > 0 ? item.images.map((image) => image.url) : [],
          category: item.category.slug,
          brand: item.brand,
          rating: item.rating,
          reviewCount: item.reviewCount,
          description: item.description || undefined,
          inStock: item.inStock
        })),
        page,
        pageSize,
        total
      };
    } catch {
      return this.getFallbackList(query, page, pageSize);
    }
  }

  async getProductBySlug(slug: string) {
    try {
      const item = await this.prisma.product.findUnique({
        where: { slug },
        include: {
          images: true,
          category: true
        }
      });

      if (!item) {
        return null;
      }

      const typedItem = item as unknown as CatalogDbProduct;

      return {
        id: typedItem.id,
        name: typedItem.name,
        slug: typedItem.slug,
        price: typedItem.price,
        originalPrice: typedItem.originalPrice || undefined,
        discount: typedItem.discount || undefined,
        images: typedItem.images.length > 0 ? typedItem.images.map((image) => image.url) : [],
        category: typedItem.category.slug,
        brand: typedItem.brand,
        rating: typedItem.rating,
        reviewCount: typedItem.reviewCount,
        description: typedItem.description || undefined,
        inStock: typedItem.inStock
      };
    } catch {
      return fallbackProducts.find((item) => item.slug === slug) || null;
    }
  }

  async createProduct(input: UpsertProductInput) {
    const category = await this.prisma.category.upsert({
      where: { slug: input.categorySlug },
      update: {},
      create: {
        slug: input.categorySlug,
        name: input.categorySlug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
    });

    const slug = this.generateSlug(input.name);
    const uniqueSlug = await this.ensureUniqueSlug(slug);

    const created = await this.prisma.product.create({
      data: {
        name: input.name,
        slug: uniqueSlug,
        description: input.description,
        price: input.price,
        originalPrice: input.originalPrice,
        discount: input.discount,
        brand: input.brand,
        sku: input.sku,
        stock: input.stock,
        inStock: input.stock > 0,
        categoryId: category.id,
        images: {
          create: (input.images || []).map((url, index) => ({
            url,
            sortOrder: index
          }))
        }
      },
      include: {
        images: true,
        category: true
      }
    });

    return created;
  }

  async updateProduct(id: string, input: Partial<UpsertProductInput>) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Product not found');
    }

    let categoryId: string | undefined;
    if (input.categorySlug) {
      const category = await this.prisma.category.upsert({
        where: { slug: input.categorySlug },
        update: {},
        create: {
          slug: input.categorySlug,
          name: input.categorySlug
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }
      });
      categoryId = category.id;
    }

    const nextStock = input.stock ?? existing.stock;
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.name ? { slug: await this.ensureUniqueSlug(this.generateSlug(input.name), id) } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.originalPrice !== undefined ? { originalPrice: input.originalPrice } : {}),
        ...(input.discount !== undefined ? { discount: input.discount } : {}),
        ...(input.brand ? { brand: input.brand } : {}),
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        inStock: nextStock > 0,
        ...(categoryId ? { categoryId } : {})
      },
      include: {
        images: true,
        category: true
      }
    });

    if (input.images) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      await this.prisma.productImage.createMany({
        data: input.images.map((url, index) => ({
          productId: id,
          url,
          sortOrder: index
        }))
      });
    }

    return updated;
  }

  async deactivateProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: {
        isActive: false,
        inStock: false
      }
    });
  }

  private generateSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string) {
    let candidate = baseSlug;
    let index = 1;

    while (true) {
      const existing = await this.prisma.product.findUnique({ where: { slug: candidate } });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      candidate = `${baseSlug}-${index}`;
      index += 1;
    }
  }

  private getFallbackList(query: ListQuery, page: number, pageSize: number) {
    let items = [...fallbackProducts];
    const minPrice = query.minPrice;
    const maxPrice = query.maxPrice;
    if (query.category) items = items.filter((item) => item.category === query.category);
    if (query.q) {
      const keyword = query.q.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(keyword));
    }
    if (typeof minPrice === 'number') items = items.filter((item) => item.price >= minPrice);
    if (typeof maxPrice === 'number') items = items.filter((item) => item.price <= maxPrice);

    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      total: items.length
    };
  }
}
