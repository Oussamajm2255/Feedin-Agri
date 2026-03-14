import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Res, Query, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import * as fileSystem from 'fs';
import { DigitalTwinsService } from './digital-twins.service';
import { CreateDigitalTwinDto } from './dto/create-digital-twin.dto';
import { UpdateDigitalTwinDto } from './dto/update-digital-twin.dto';

// Ensure the upload directory exists
const UPLOAD_DIR = './uploads/digital-twins';
if (!fileSystem.existsSync(UPLOAD_DIR)) {
  fileSystem.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('digital-twins')
export class DigitalTwinsController {
  constructor(private readonly digitalTwinsService: DigitalTwinsService) {}

  @Post()
  create(@Body() createDto: CreateDigitalTwinDto) {
    return this.digitalTwinsService.create(createDto);
  }

  @Get()
  findAll(@Query('farmId') farmId: string) {
    if (!farmId) {
      throw new BadRequestException('farmId query parameter is required');
    }
    return this.digitalTwinsService.findAllByFarm(farmId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.digitalTwinsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDigitalTwinDto) {
    return this.digitalTwinsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.digitalTwinsService.remove(id);
  }

  @Post(':id/media')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: UPLOAD_DIR,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${req.params.id}-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|mp4|webm)$/)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Unsupported file type'), false);
      }
    },
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  }))
  async uploadMedia(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    // Media URL is the server relative path to serve it
    const mediaUrl = `/api/v1/digital-twins/media/${file.filename}`;
    return this.digitalTwinsService.updateMediaUrl(id, mediaUrl);
  }

  @Get('media/:filename')
  serveMedia(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), UPLOAD_DIR, filename);
    if (!fileSystem.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }
    res.sendFile(filePath);
  }
}
