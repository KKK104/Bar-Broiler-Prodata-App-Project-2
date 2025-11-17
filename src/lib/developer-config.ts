// Developer Access Configuration
// Update this file to manage who can access developer features

export const AUTHORIZED_DEVELOPERS = [
  // Replace with your actual email address
  "your-email@example.com",
  
  // Add additional authorized emails here
  "admin@prodata.com",
  "developer@prodata.com",
  
  // Example: Add your team members
  // "team-member@company.com",
  // "senior-dev@company.com",
]

// Check if a user is authorized to access developer features
export function isAuthorizedDeveloper(userEmail: string | null | undefined): boolean {
  if (!userEmail) return false
  return AUTHORIZED_DEVELOPERS.includes(userEmail.toLowerCase())
}

// Get the list of authorized developers (for admin purposes)
export function getAuthorizedDevelopers(): string[] {
  return [...AUTHORIZED_DEVELOPERS]
}

// Add a new authorized developer (for admin purposes)
export function addAuthorizedDeveloper(email: string): void {
  if (!AUTHORIZED_DEVELOPERS.includes(email.toLowerCase())) {
    AUTHORIZED_DEVELOPERS.push(email.toLowerCase())
  }
}

// Remove an authorized developer (for admin purposes)
export function removeAuthorizedDeveloper(email: string): void {
  const index = AUTHORIZED_DEVELOPERS.indexOf(email.toLowerCase())
  if (index > -1) {
    AUTHORIZED_DEVELOPERS.splice(index, 1)
  }
} 