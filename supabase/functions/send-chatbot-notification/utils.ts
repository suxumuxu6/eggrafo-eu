
// Rate limiting map
const rateLimit = new Map<string, number>();

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeText = (text: string): string => {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

export const checkRateLimit = (req: Request): boolean => {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  
  if (rateLimit.has(ip) && now - (rateLimit.get(ip) || 0) < 5000) {
    console.log("⚠️ Rate limit exceeded for IP:", ip);
    return false;
  }
  
  rateLimit.set(ip, now);
  return true;
};

export const validateRequest = (requestBody: any): string | null => {
  console.log("🔍 Validating request:", {
    hasType: !!requestBody.type,
    hasEmail: !!requestBody.email,
    hasTicketCode: !!requestBody.ticketCode,
    hasChatId: !!requestBody.chatId
  });

  const { type, email, ticketCode, chatId } = requestBody;
  
  if (!type || !email || !ticketCode || !chatId) {
    console.error("❌ Missing required fields:", { 
      type: !!type, 
      email: !!email, 
      ticketCode: !!ticketCode, 
      chatId: !!chatId 
    });
    return "Missing required fields: type, email, ticketCode, or chatId";
  }

  if (!isValidEmail(email)) {
    console.error("❌ Invalid email format:", email?.substring(0, 5) + "***");
    return "Invalid email format";
  }

  const validTypes = ["new_ticket", "user_reply", "user_welcome", "ticket_closed", "admin_reply"];
  if (!validTypes.includes(type)) {
    console.error("❌ Invalid notification type:", type);
    return `Invalid notification type: ${type}. Valid types: ${validTypes.join(', ')}`;
  }

  console.log("✅ Request validation successful");
  return null;
};
