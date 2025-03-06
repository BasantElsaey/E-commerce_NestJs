import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

const configService = new ConfigService();

cloudinary.config({
  cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
  api_key: configService.get<string>('CLOUDINARY_API_KEY'),
  api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
});


export const storage = new CloudinaryStorage({
   cloudinary,
   params : async () : Promise<UploadApiOptions> => ({
       folder : 'ecommerce/products',
       allowedFormats : ['jpg', 'png', 'jpeg'],
       resource_type : 'image',
    //    transformation : [{ width: 500, height: 500, crop: 'limit' }]
   }),
});