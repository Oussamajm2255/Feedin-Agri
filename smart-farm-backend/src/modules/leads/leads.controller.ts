import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { LeadsService } from "./leads.service";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import { CreateTrainingRequestDto } from "./dto/create-training-request.dto";

/**
 * Public-facing controller for lead capture forms on the landing pages.
 * No JWT authentication required — these endpoints serve anonymous visitors.
 *
 * Rate limited to 5 requests per 60 seconds per IP to prevent abuse.
 */
@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * Submit a contact form from the Contact landing page.
   * POST /api/leads/contact
   */
  @Post("contact")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async submitContact(@Body() dto: CreateContactRequestDto) {
    const request = await this.leadsService.createContactRequest(dto);
    return {
      success: true,
      message: "Contact request submitted successfully",
      id: request.id,
    };
  }

  /**
   * Submit a training request from the Formation page drawer.
   * POST /api/leads/training-request
   */
  @Post("training-request")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async submitTrainingRequest(@Body() dto: CreateTrainingRequestDto) {
    const request = await this.leadsService.createTrainingRequest(dto);
    return {
      success: true,
      message: "Training request submitted successfully",
      id: request.id,
    };
  }
}
