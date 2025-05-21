'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

interface FormData {
  email: string;
  password: string;
}

export async function signup(data: FormData) {
  const supabase = await createClient();
  // Vous pourriez vouloir ajouter une URL de redirection pour la confirmation d'e-mail
  // const redirectTo = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` : 'http://localhost:3000/auth/callback';
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    // options: {
    //   emailRedirectTo: redirectTo,
    // },
  });

  if (error) {
    console.error('Signup error:', error.message);
    return { error: true, message: error.message }; // Renvoyer le message d'erreur peut être utile
  }

  // Après l'inscription, Supabase envoie généralement un e-mail de confirmation.
  // La redirection immédiate vers '/' peut ne pas être idéale si vous attendez une confirmation.
  // Vous pourriez rediriger vers une page "Veuillez vérifier votre e-mail".
  // Pour l'instant, on garde la logique originale.
  revalidatePath('/', 'layout');
  redirect('/'); // Ou vers une page de confirmation
}
