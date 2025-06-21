
// Input validation and sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
};

export const sanitizeEmail = (email: string): string => {
  return email
    .toLowerCase()
    .trim()
    .substring(0, 254); // RFC 5321 limit
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateDocumentTitle = (title: string): boolean => {
  return title.length >= 1 && title.length <= 200;
};

export const validateDocumentDescription = (description: string): boolean => {
  return description.length <= 1000;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeBytes: number): boolean => {
  return file.size <= maxSizeBytes;
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe characters
    .substring(0, 100); // Limit length
};

export const validateSupportTicketCode = (code: string): boolean => {
  // Ticket codes should be alphanumeric and reasonable length
  const ticketRegex = /^[a-zA-Z0-9-]{6,20}$/;
  return ticketRegex.test(code);
};
