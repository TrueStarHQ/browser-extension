// Get compiled CSS for Shadow DOM injection
export function getComponentStyles(): string {
  // For now, return essential styles to ensure the panel is visible
  // In production, this should be replaced with the full compiled CSS
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    /* Reset */
    *, *::before, *::after {
      box-sizing: border-box;
    }
    
    /* Essential styles for visibility */
    .fixed { position: fixed !important; }
    .absolute { position: absolute !important; }
    .relative { position: relative !important; }
    .top-5 { top: 1.25rem !important; }
    .top-3 { top: 0.75rem !important; }
    .right-5 { right: 1.25rem !important; }
    .right-3 { right: 0.75rem !important; }
    .w-\\[300px\\] { width: 300px !important; }
    .z-\\[10000\\] { z-index: 10000 !important; }
    .pr-10 { padding-right: 2.5rem !important; }
    .shadow-lg {
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
    }
    .rounded-lg { border-radius: 0.5rem !important; }
    .bg-white { background-color: #ffffff !important; }
    .bg-card { background-color: #ffffff !important; }
    .border { border-width: 1px !important; }
    .border-gray-200 { border-color: #e5e7eb !important; }
    .p-4 { padding: 1rem !important; }
    .p-6 { padding: 1.5rem !important; }
    .pb-3 { padding-bottom: 0.75rem !important; }
    .pt-0 { padding-top: 0 !important; }
    .space-y-4 > * + * { margin-top: 1rem !important; }
    .text-lg { font-size: 1.125rem !important; }
    .text-sm { font-size: 0.875rem !important; }
    .font-medium { font-weight: 500 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-bold { font-weight: 700 !important; }
    .text-gray-900 { color: #111827 !important; }
    .text-gray-600 { color: #4b5563 !important; }
    .text-muted-foreground { color: #6b7280 !important; }
    .text-primary { color: #0ea5e9 !important; }
    .text-red-600 { color: #dc2626 !important; }
    .text-orange-500 { color: #f97316 !important; }
    .text-green-600 { color: #16a34a !important; }
    .bg-red-600 { background-color: #dc2626 !important; }
    .bg-orange-500 { background-color: #f97316 !important; }
    .bg-green-600 { background-color: #16a34a !important; }
    .bg-gray-200 { background-color: #e5e7eb !important; }
    .flex { display: flex !important; }
    .inline-flex { display: inline-flex !important; }
    .items-center { align-items: center !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-center { justify-content: center !important; }
    .h-8 { height: 2rem !important; }
    .w-8 { width: 2rem !important; }
    .h-2 { height: 0.5rem !important; }
    .w-full { width: 100% !important; }
    .mb-2 { margin-bottom: 0.5rem !important; }
    .mt-2 { margin-top: 0.5rem !important; }
    .ml-4 { margin-left: 1rem !important; }
    .-mr-2 { margin-right: -0.5rem !important; }
    .-mt-1 { margin-top: -0.25rem !important; }
    .rounded-full { border-radius: 9999px !important; }
    .transition-all { transition-property: all !important; }
    .cursor-pointer { cursor: pointer !important; }
    .hover\\:underline:hover { text-decoration: underline !important; }
    .list-disc { list-style-type: disc !important; }
    .space-y-1 > * + * { margin-top: 0.25rem !important; }
    
    /* Button styles */
    .bg-primary { background-color: #0ea5e9 !important; }
    .hover\\:bg-primary\\/90:hover { background-color: rgb(14 165 233 / 0.9) !important; }
    
    /* Base button styles */
    button {
      border-radius: 0.375rem !important;
      font-weight: 500 !important;
      transition-property: color, background-color, border-color !important;
      transition-duration: 150ms !important;
      border: none !important;
      cursor: pointer !important;
    }
    
    /* Ghost button variant */
    button[data-variant="ghost"] {
      background-color: transparent !important;
      color: #4b5563 !important;
    }
    button[data-variant="ghost"]:hover {
      background-color: #f3f4f6 !important;
      color: #111827 !important;
    }
    
    /* Size variants */
    button[data-size="icon"] {
      height: 2rem !important;
      width: 2rem !important;
      padding: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 1.5rem !important;
      line-height: 1 !important;
      border-radius: 0.375rem !important;
    }
    
    /* Card styles */
    .bg-card { background-color: #ffffff !important; }
    .text-card-foreground { color: #111827 !important; }
    
    /* Details/Summary styles */
    details summary {
      list-style: none !important;
      cursor: pointer !important;
    }
    details summary::-webkit-details-marker {
      display: none !important;
    }
    details summary::before {
      content: "▶" !important;
      display: inline-block !important;
      margin-right: 0.5rem !important;
      transition: transform 0.2s !important;
    }
    details[open] summary::before {
      transform: rotate(90deg) !important;
    }
    
    /* Focus styles */
    button:focus { outline: 2px solid transparent !important; outline-offset: 2px !important; }
  `;
}
