import Stripe from "stripe";
import { env } from "@/env";

// Initialize Stripe with the secret key from environment variables
// Use a type assertion to ensure the string is accepted by Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export default stripe;
