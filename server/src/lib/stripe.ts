import Stripe from "stripe";
import { env, hasStripe } from "../config/env.js";

export const stripe: Stripe | null = hasStripe ? new Stripe(env.stripeSecretKey) : null;
