import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.propertiesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  async create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Post('propietario')
  @UseGuards(AuthGuard)
  async createForPropietario(@Body() createPropertyDto: CreatePropertyDto, @Req() req: any) {
    // Vinculación obligatoria del ownerId del usuario logueado
    const ownerId = req.user.id;
    return this.propertiesService.create({
      ...createPropertyDto,
      ownerId,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }
}
