import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('search')
  async searchPost(
    @Body()
    payload: {
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
    }
  ) {
    return this.searchService.search(payload);
  }

  @Get('search')
  async searchGet(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('brands') brands?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRating') minRating?: string,
    @Query('inStock') inStock?: string,
    @Query('sortBy') sortBy?: 'newest' | 'price-low' | 'price-high' | 'rating-high' | 'popular',
    @Query('facets') facets?: string
  ) {
    return this.searchService.search({
      q: q || '',
      page: page ? Math.max(1, Number(page)) : 1,
      pageSize: pageSize ? Math.max(1, Math.min(100, Number(pageSize))) : 20,
      category,
      brand,
      brands: brands ? brands.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      sortBy,
      facets: facets === 'true'
    });
  }

  @Get('search/filters')
  async getFilters() {
    return this.searchService.getFilters();
  }

  @Get('search/suggestions')
  async getSuggestions(@Query('q') q?: string, @Query('limit') limit?: string) {
    const limitNum = limit ? Math.max(1, Math.min(20, Number(limit))) : 10;
    return this.searchService.getSuggestions(q || '', limitNum);
  }
}
