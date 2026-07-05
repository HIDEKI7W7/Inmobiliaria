import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('permissions')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('modules')
  async getModules() {
    return this.permissionsService.getModules();
  }

  @Get('roles')
  async getRolePermissions() {
    return this.permissionsService.getRolePermissions();
  }

  @Put('role')
  async updateRolePermission(
    @Body() body: { role: Role; moduleId: string; allowed: boolean },
  ) {
    return this.permissionsService.updateRolePermission(
      body.role,
      body.moduleId,
      body.allowed,
    );
  }

  @Get('users')
  async getUsers() {
    return this.permissionsService.getUsers();
  }

  @Post('users')
  async createUser(@Body() body: any) {
    return this.permissionsService.createUser(body);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    try {
      return await this.permissionsService.updateUser(id, body);
    } catch (error) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  @Delete('users/:id')
  async deactivateUserAccount(@Param('id') id: string) {
    try {
      const updatedUser = await this.permissionsService.deactivateUser(id);
      if (!updatedUser) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return {
        message: 'Acceso cancelado exitosamente. Historial conservado para analítica.',
        user: updatedUser,
      };
    } catch (error) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  @Put('user-override')
  async updateUserOverride(
    @Body() body: { userId: string; moduleId: string; allowed: boolean },
  ) {
    return this.permissionsService.updateUserOverride(
      body.userId,
      body.moduleId,
      body.allowed,
    );
  }
}
