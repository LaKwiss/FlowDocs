'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

interface FormData {
  email: string;
  password: string;
}
export async function login(data: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: true };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signInWithGithub() {
  const supabase = await createClient();
  // Mettez à jour redirectTo pour qu'il corresponde à votre domaine de production ou de développement si nécessaire.
  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : 'http://localhost:3000/auth/callback';
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectTo,
    },
  });
  if (data.url) {
    redirect(data.url);
  }
}

export async function loginAnonymously() {
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInAnonymously();

  // La mise à jour de l'e-mail pour un utilisateur anonyme peut nécessiter une logique différente
  // ou être gérée différemment selon votre cas d'usage.
  // L'e-mail fourni ici semble être un placeholder.
  // Si vous n'avez pas besoin de cette fonctionnalité, vous pouvez la commenter ou la supprimer.
  // const { error: updateUserError } = await supabase.auth.updateUser({
  //   email: `aeroedit+${Date.now().toString(36)}@example.com`, // Utilisez un domaine que vous contrôlez ou un placeholder approprié
  // });

  // if (signInError || updateUserError) {
  if (signInError) {
    return { error: true };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
