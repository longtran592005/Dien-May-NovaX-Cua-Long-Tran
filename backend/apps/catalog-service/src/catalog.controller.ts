import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
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

const sanitizeCategoryFolder = (raw?: string) => {
  const normalized = (raw || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return normalized || 'khac';
};

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

  @Post('admin/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const categoryFolder = sanitizeCategoryFolder((req.body?.category as string) || '');
        const targetDir = join(process.cwd(), '..', 'public', 'images', 'products', categoryFolder);
        mkdirSync(targetDir, { recursive: true });
        cb(null, targetDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      }
    })
  }))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const categoryFolder = sanitizeCategoryFolder((file as any)?.destination?.split(/[/\\]/).pop());
    return { url: `/images/products/${categoryFolder}/${file.filename}` };
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

  // ============= STORES & REVIEWS =============

  @Get('stores/list')
  async listStores() {
    return this.catalogService.listStores();
  }

  @Get(':id/stock')
  async getStoreStock(@Param('id') id: string) {
    return this.catalogService.getStoreStock(id);
  }

  @Post(':id/reviews')
  async addReview(
    @Param('id') productId: string,
    @Headers('x-user-id') userId: string,
    @Body() data: any
  ) {
    return this.catalogService.addReview(userId, productId, data);
  }
}
