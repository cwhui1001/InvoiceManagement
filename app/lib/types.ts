// Database type definitions

export type Profile = {
  id: string
  full_name: string | null
  username: string | null
  email: string | null
  avatar_url: string | null
}

export type User = {
  id: string
  email?: string
  // Add other user fields as needed
}
