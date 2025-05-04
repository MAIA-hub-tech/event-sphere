/**
 * AWS S3 Image URL Utilities
 */

// AWS S3 configuration
const AWS_CONFIG = {
    BUCKET_NAME: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || '',
    REGION: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    CLOUDFRONT_DOMAIN: process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || ''
  };
  
  /**
   * Get a safe image URL that works in both dev and prod environments
   * @param url The original image URL (can be S3 URL, CloudFront URL, or relative path)
   */
  export function getSafeImageUrl(url: string): string {
    if (!url) return '/assets/images/image-placeholder.png';
    
    // Handle relative paths
    if (url.startsWith('/')) return url;
    
    // Handle CloudFront URLs
    if (AWS_CONFIG.CLOUDFRONT_DOMAIN && url.includes(AWS_CONFIG.CLOUDFRONT_DOMAIN)) {
      return url;
    }
    
    // Handle S3 URLs
    if (url.includes('amazonaws.com')) {
      // Convert S3 URL to CloudFront if configured
      if (AWS_CONFIG.CLOUDFRONT_DOMAIN) {
        const key = extractS3Key(url);
        return `https://${AWS_CONFIG.CLOUDFRONT_DOMAIN}/${key}`;
      }
      return url;
    }
    
    // Fallback for other absolute URLs
    return url;
  }
  
  /**
   * Extract S3 object key from URL
   * @param url S3 URL (either virtual-hosted or path-style)
   */
  export function extractS3Key(url: string): string {
    if (!url.includes('amazonaws.com')) return url;
    
    // Handle virtual-hosted style URLs
    // Example: https://bucket-name.s3.region.amazonaws.com/key
    if (url.includes('.s3.')) {
      return url.split('.s3.')[1].split('/').slice(1).join('/');
    }
    
    // Handle path-style URLs
    // Example: https://s3.region.amazonaws.com/bucket-name/key
    return url.split('amazonaws.com/')[1].split('/').slice(1).join('/');
  }
  
  /**
   * Generate S3 upload URL parameters
   * @param fileName Original file name
   * @param fileType MIME type
   * @param userId Current user ID
   */
  export function generateUploadParams(fileName: string, fileType: string, userId: string) {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const key = `uploads/${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${extension}`;
    
    return {
      key,
      contentType: fileType,
      acl: 'public-read',
      cacheControl: 'max-age=31536000',
      bucket: AWS_CONFIG.BUCKET_NAME,
      region: AWS_CONFIG.REGION
    };
  }
  
  /**
   * Validate image file
   * @param file File object
   * @param maxSizeMB Maximum size in MB
   */
  export function validateImageFile(file: File, maxSizeMB = 5): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = maxSizeMB * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: `File too large. Maximum size is ${maxSizeMB}MB.` };
    }
    
    return { valid: true };
  }
  
  /**
   * Generate thumbnail URL for an S3 image
   * @param originalUrl Original image URL
   * @param width Thumbnail width
   */
  export function getThumbnailUrl(originalUrl: string, width = 300): string {
    if (!originalUrl.includes('amazonaws.com')) return originalUrl;
    
    const key = extractS3Key(originalUrl);
    if (AWS_CONFIG.CLOUDFRONT_DOMAIN) {
      return `https://${AWS_CONFIG.CLOUDFRONT_DOMAIN}/${key}?w=${width}&q=80`;
    }
    
    // Fallback to original URL if no CloudFront configured
    return originalUrl;
  }