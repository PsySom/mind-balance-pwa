// Public configuration constants
// These are safe to store in the codebase as they are public/publishable keys

export const config = {
  supabase: {
    url: 'https://wzgmfdtqxtuzujipoimc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Z21mZHRxeHR1enVqaXBvaW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5Nzc5NzIsImV4cCI6MjA3NDU1Mzk3Mn0.6uBF_pdzy8PjSAPOvGwSonmWul8YYHBDwAMHz7Tytb8',
  },
  webhooks: {
    tracker: 'https://mentalbalans.com/webhook/tracker-submit',
    diary: 'https://mentalbalans.com/webhook/ai-diary-message',
  },
} as const;
