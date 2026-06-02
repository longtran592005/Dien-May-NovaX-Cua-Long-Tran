import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

type SearchInput = {
  q?: string;
  page?: number;
  pageSize?: number;
  category?: string;
  brand?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'rating-high' | 'popular';
  facets?: boolean;
};

type SearchHit = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  images?: string[];
};

type SearchResult = {
  hits: SearchHit[];
  totalHits: number;
  page: number;
  pageSize: number;
  facets?: {
    categories: Array<{ name: string; count: number }>;
    brands: Array<{ name: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
    ratings: Array<{ rating: number; count: number }>;
  };
};

@Injectable()
export class SearchService {
  private readonly logger = new Logger('SearchService');

  constructor(private readonly prisma: PrismaService) {}

  async search(input: SearchInput): Promise<SearchResult> {
    try {
      const query = (input.q || '').trim().toLowerCase();
      const normalizedQuery = this.normalizeText(query);
      const queryTokens = this.tokenize(normalizedQuery);
      const page = Math.max(1, input.page || 1);
      const pageSize = Math.min(100, Math.max(1, input.pageSize || 20));
      const offset = (page - 1) * pageSize;

      const where: any = {
        isActive: true
      };

      // Text search
      if (query) {
        const searchTerms = [query, ...queryTokens].filter(Boolean);
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          {
            category: {
              name: { contains: query, mode: 'insensitive' }
            }
          },
          ...searchTerms.flatMap((term) => [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { sku: { contains: term, mode: 'insensitive' } },
            { brand: { contains: term, mode: 'insensitive' } },
            {
              category: {
                name: { contains: term, mode: 'insensitive' }
              }
            }
          ])
        ];
      }

      // Filters
      if (input.category) {
        const categoryText = input.category.trim();
        where.category = {
          OR: [
            { slug: categoryText },
            { name: { equals: categoryText, mode: 'insensitive' } }
          ]
        };
      }
      const selectedBrands = [
        ...(input.brand ? [input.brand] : []),
        ...(input.brands || [])
      ]
        .map((brand) => brand.trim())
        .filter(Boolean);

      if (selectedBrands.length > 0) {
        where.brand = selectedBrands.length === 1
          ? { equals: selectedBrands[0], mode: 'insensitive' }
          : { in: selectedBrands };
      }
      if (input.minPrice !== undefined || input.maxPrice !== undefined) {
        where.price = {};
        if (input.minPrice !== undefined) {
          where.price.gte = Math.max(0, input.minPrice);
        }
        if (input.maxPrice !== undefined) {
          where.price.lte = Math.max(0, input.maxPrice);
        }
      }
      if (input.minRating !== undefined) {
        where.rating = { gte: Math.max(0, Math.min(5, input.minRating)) };
      }
      if (input.inStock !== undefined) {
        where.inStock = input.inStock;
      }

      // Determine sort order
      let orderBy: any = { createdAt: 'desc' };
      if (input.sortBy === 'price-low') {
        orderBy = { price: 'asc' };
      } else if (input.sortBy === 'price-high') {
        orderBy = { price: 'desc' };
      } else if (input.sortBy === 'rating-high') {
        orderBy = { rating: 'desc' };
      } else if (input.sortBy === 'popular') {
        orderBy = { reviewCount: 'desc' };
      }

      // Get total count
      const totalHits = await this.prisma.product.count({ where });

      const candidateLimit = query ? Math.min(1000, Math.max(pageSize * 20, 200)) : pageSize;

      // Fetch products
      const products = await this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          originalPrice: true,
          discount: true,
          category: {
            select: {
              name: true,
              slug: true
            }
          },
          brand: true,
          rating: true,
          reviewCount: true,
          inStock: true,
          images: {
            select: {
              url: true,
              sortOrder: true
            },
            orderBy: {
              sortOrder: 'asc'
            }
          }
        },
        orderBy,
        take: candidateLimit,
        skip: query ? 0 : offset
      });

      const scoredProducts = query
        ? products
            .map((product) => ({
              product,
              score: this.scoreProduct(product, normalizedQuery, queryTokens)
            }))
            .sort((left, right) => right.score - left.score)
        : products.map((product) => ({ product, score: 0 }));

      const pagedProducts = query ? scoredProducts.slice(offset, offset + pageSize).map((entry) => entry.product) : scoredProducts.map((entry) => entry.product);

      const hits: SearchHit[] = pagedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice || undefined,
        discount: product.discount || undefined,
        category: product.category?.name || 'Khac',
        brand: product.brand,
        rating: product.rating,
        reviewCount: product.reviewCount,
        inStock: product.inStock,
        images: product.images.map((image) => image.url)
      }));

      const result: SearchResult = {
        hits,
        totalHits,
        page,
        pageSize
      };

      // Add facets if requested
      if (input.facets) {
        const [categoryCounts, brandCounts, allProducts] = await Promise.all([
          this.prisma.product.groupBy({
            by: ['categoryId'],
            where,
            _count: {
              _all: true
            },
            orderBy: {
              _count: {
                categoryId: 'desc'
              }
            }
          }),
          this.prisma.product.groupBy({
            by: ['brand'],
            where,
            _count: {
              _all: true
            },
            orderBy: {
              _count: {
                brand: 'desc'
              }
            }
          }),
          this.prisma.product.findMany({
            where,
            select: { price: true, rating: true }
          })
        ]);

        const categoryIds = categoryCounts.map((entry) => entry.categoryId);
        const categories = await this.prisma.category.findMany({
          where: {
            id: {
              in: categoryIds
            }
          },
          select: {
            id: true,
            name: true
          }
        });
        const categoryMap = new Map(categories.map((item) => [item.id, item.name]));

        result.facets = {
          categories: categoryCounts.map((entry) => ({
            name: categoryMap.get(entry.categoryId) || 'Khac',
            count: entry._count._all
          })),
          brands: brandCounts.map((entry) => ({
            name: entry.brand,
            count: entry._count._all
          })),
          priceRanges: this.buildPriceFacets(allProducts),
          ratings: this.buildRatingFacets(allProducts)
        };
      }

      return result;
    } catch (error: any) {
      this.logger.error(`Search failed: ${error.message}`, error);
      throw new BadRequestException(`Search failed: ${error.message}`);
    }
  }

  private buildPriceFacets(products: Array<{ price: number }>): Array<{ range: string; count: number }> {
    const ranges = [
      { range: '0-100k', min: 0, max: 100000 },
      { range: '100k-500k', min: 100000, max: 500000 },
      { range: '500k-1m', min: 500000, max: 1000000 },
      { range: '1m+', min: 1000000, max: Infinity }
    ];

    return ranges.map((r) => ({
      range: r.range,
      count: products.filter((p) => p.price >= r.min && p.price < r.max).length
    }));
  }

  private buildRatingFacets(products: Array<{ rating: number }>): Array<{ rating: number; count: number }> {
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: products.filter((p) => p.rating >= rating).length
    }));
  }

  async getFilters(): Promise<{
    categories: string[];
    brands: string[];
    priceRange: { min: number; max: number };
    ratings: number[];
  }> {
    try {
      const [categories, brands, priceData] = await Promise.all([
        this.prisma.category.findMany({
          where: {
            products: {
              some: {
                isActive: true
              }
            }
          },
          select: {
            name: true
          },
          orderBy: {
            name: 'asc'
          }
        }),
        this.prisma.product.findMany({
          select: { brand: true },
          distinct: ['brand'],
          where: {
            isActive: true,
            brand: {
              not: ''
            }
          },
          orderBy: {
            brand: 'asc'
          }
        }),
        this.prisma.product.aggregate({
          where: {
            isActive: true
          },
          _min: { price: true },
          _max: { price: true }
        })
      ]);

      return {
        categories: categories.map((c) => c.name).filter(Boolean),
        brands: brands.map((b) => b.brand).filter(Boolean),
        priceRange: {
          min: priceData._min.price || 0,
          max: priceData._max.price || 1000000
        },
        ratings: [5, 4, 3, 2, 1]
      };
    } catch (error: any) {
      this.logger.error(`Failed to get filters: ${error.message}`, error);
      throw new BadRequestException(`Failed to get filters: ${error.message}`);
    }
  }

  async getSuggestions(query: string, limit: number = 10): Promise<string[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const normalizedQuery = this.normalizeText(query.trim().toLowerCase());
      const queryTokens = this.tokenize(normalizedQuery);

      const suggestions = await this.prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
            {
              category: {
                name: { contains: query, mode: 'insensitive' }
              }
            },
            ...queryTokens.flatMap((term) => [
              { name: { contains: term, mode: 'insensitive' } },
              { brand: { contains: term, mode: 'insensitive' } },
              {
                category: {
                  name: { contains: term, mode: 'insensitive' }
                }
              }
            ])
          ] as any
        },
        select: { name: true },
        take: limit,
        distinct: ['name']
      });

      return suggestions
        .map((s) => s.name)
        .sort((left, right) => this.scoreText(right, normalizedQuery, queryTokens) - this.scoreText(left, normalizedQuery, queryTokens));
    } catch (error: any) {
      this.logger.error(`Failed to get suggestions: ${error.message}`, error);
      return [];
    }
  }

  private normalizeText(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenize(value: string) {
    return value.split(' ').map((part) => part.trim()).filter((part) => part.length >= 2);
  }

  private scoreText(value: string, normalizedQuery: string, tokens: string[]) {
    const normalizedValue = this.normalizeText(value.toLowerCase());
    let score = 0;

    if (normalizedValue === normalizedQuery) score += 100;
    if (normalizedValue.startsWith(normalizedQuery)) score += 50;
    if (normalizedValue.includes(normalizedQuery)) score += 25;

    for (const token of tokens) {
      if (normalizedValue.includes(token)) {
        score += 10;
      }
      if (normalizedValue.startsWith(token)) {
        score += 5;
      }
    }

    return score;
  }

  private scoreProduct(product: any, normalizedQuery: string, tokens: string[]) {
    let score = 0;
    const nameScore = this.scoreText(product.name, normalizedQuery, tokens);
    const brandScore = this.scoreText(product.brand || '', normalizedQuery, tokens);
    const categoryScore = this.scoreText(product.category?.name || '', normalizedQuery, tokens);
    const skuScore = this.scoreText(product.slug || '', normalizedQuery, tokens);
    const descriptionScore = this.scoreText(product.description || '', normalizedQuery, tokens);

    score += nameScore * 3;
    score += brandScore * 2;
    score += categoryScore * 2;
    score += skuScore * 2;
    score += descriptionScore;
    score += product.inStock ? 8 : 0;
    score += Math.min(20, Math.floor(product.rating * 4));
    score += Math.min(20, product.reviewCount);

    return score;
  }
}
