// lib/imageUtils.ts
export const getSafeImageUrl = (url: string | undefined): string => {
    // Default placeholder image path (create this image in your public folder)
    const placeholder = '/assets/images/placeholder.jpg';
    
    if (!url) return placeholder;
    
    try {
      new URL(url); // This validates the URL format
      return url;
    } catch (error) {
      console.error('Invalid image URL:', url, error);
      return placeholder;
    }
  };