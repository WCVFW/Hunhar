import c1 from '../assets/CHARACTERS/C1.png'
import c2 from '../assets/CHARACTERS/C2.png'
import c3 from '../assets/CHARACTERS/C3.png'
import c4 from '../assets/CHARACTERS/C4.png'
import c5 from '../assets/CHARACTERS/C5.png'
import c6 from '../assets/CHARACTERS/C6.png'
import c7 from '../assets/CHARACTERS/C7.png'
import c8 from '../assets/CHARACTERS/C8.png'
import c9 from '../assets/CHARACTERS/C9.png'

export const CHARACTER_AVATARS: string[] = [c1, c2, c3, c4, c5, c6, c7, c8, c9]

/**
 * Deterministically maps any user (by id, email, or name) to one of the 9 character avatars.
 * This ensures:
 * 1. Each user gets their assigned character consistently.
 * 2. Different users get shuffled evenly across the 9 characters (C1 to C9).
 */
export function getCharacterAvatar(seed?: string | null): string {
  if (!seed || seed.trim() === '') {
    const randomIndex = Math.floor(Math.random() * CHARACTER_AVATARS.length)
    return CHARACTER_AVATARS[randomIndex]
  }

  // DJB2 hash algorithm for uniform distribution across 9 avatars
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i)
  }
  const index = Math.abs(hash) % CHARACTER_AVATARS.length
  return CHARACTER_AVATARS[index]
}

/**
 * Returns a randomly shuffled character avatar (e.g. on new profile creation / sign up).
 */
export function getRandomCharacterAvatar(): string {
  const index = Math.floor(Math.random() * CHARACTER_AVATARS.length)
  return CHARACTER_AVATARS[index]
}
