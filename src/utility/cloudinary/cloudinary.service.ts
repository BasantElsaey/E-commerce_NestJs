import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
    UploadApiResponse, 
    UploadApiErrorResponse,
    v2 as cloudinary 
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => { 
      cloudinary.uploader.upload_stream(
        { folder: 'e-commerce/products' },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(file.buffer);
    });
  }

  async uploadInvoice(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'ecommerce/invoices', 
          resource_type: 'auto', // support type of files
          allowed_formats: ['pdf', 'jpg', 'png', 'jpeg'],
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) reject(error);
          else resolve(result);
        },
      ).end(file.buffer);
    });
  }
}

