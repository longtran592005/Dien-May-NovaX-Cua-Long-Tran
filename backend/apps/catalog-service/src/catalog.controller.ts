import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common';
import { CatalogService } from './catalog.service';

interface UpsertProductDto {
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

@Controller('products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async listProducts(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20'
  ) {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Number.MAX_SAFE_INTEGER;
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Number(pageSize) || 20);

    return this.catalogService.listProducts({
      q,
      category,
      minPrice: min,
      maxPrice: max,
      page: safePage,
      pageSize: safePageSize
    });
  }

  @Get(':slug')
  async getProductDetail(@Param('slug') slug: string) {
    const product = await this.catalogService.getProductBySlug(slug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Post('admin/create')
  async createProduct(@Body() payload: UpsertProductDto) {
    try {
      return await this.catalogService.createProduct(payload);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  @Put('admin/:id')
  async updateProduct(@Param('id') id: string, @Body() payload: Partial<UpsertProductDto>) {
    try {
      return await this.catalogService.updateProduct(id, payload);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        throw new NotFoundException(message);
      }
      throw new BadRequestException(message);
    }
  }

  @Delete('admin/:id')
  async deactivateProduct(@Param('id') id: string) {
    try {
      return await this.catalogService.deactivateProduct(id);
    } catch {
      throw new NotFoundException('Product not found');
    }
  }
}
