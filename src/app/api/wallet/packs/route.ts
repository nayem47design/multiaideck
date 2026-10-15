import { packsResponse } from "@/lib/payments/packs";
import { json, route } from "@/lib/server/api";

// Top-up packs, custom amount bounds and Pro. Static: the same for everyone.
export const GET = route(async () => json(packsResponse()));
