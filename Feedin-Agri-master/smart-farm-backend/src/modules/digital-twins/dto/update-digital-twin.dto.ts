import { PartialType } from '@nestjs/mapped-types';
import { CreateDigitalTwinDto } from './create-digital-twin.dto';

export class UpdateDigitalTwinDto extends PartialType(CreateDigitalTwinDto) {}
