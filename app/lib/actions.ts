'use server'

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const UserSchema = z.object({
  Id: z.string(),
  name: z.string(),
  email: z.string().email('Invalid email format.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.')
});

export type UserState = {
  errors?: {
    username?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string | null;
};

const saltRounds = 10;

export async function hashPassword(password: string): Promise<string> {
  // Generate a salt and hash on separate function calls
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

// Create User Function
export async function signUp(formData: FormData) {
  console.log(formData);
  const Id = uuidv4();
  const validatedUser = UserSchema.safeParse({
    // username: formData.get('username'),
    Id: Id,
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  
  console.log(validatedUser);
  
  
  
  if (!validatedUser.success) {
    return {
      errors: validatedUser.error.flatten().fieldErrors,
      message: 'Invalid input. Failed to create user.',
    };
  }
  const { name, email, password } = validatedUser.data;
  
  
  const hashedPassword = await hashPassword(password);

  try {
    const result = await sql`
      INSERT INTO users (id, name, email, password)
      VALUES (${Id}, ${name}, ${email}, ${hashedPassword})
      RETURNING *;
    `;

    // User created successfully, now sign them in automatically
    const signInResult = await signIn('credentials', {
      email,
      password, // Use the plain text password for the sign-in attempt
      redirect: false,
    });

    if (signInResult?.error) {
      throw new Error(signInResult.error);
    }

    console.log('signInResult:', signInResult);

    if (signInResult?.url) {
      // Return the URL to the client for redirection
      return { 
        message: 'User created and signed in successfully', 
        user: result.rows[0],
        redirectUrl: '/dashboard'
      };
    }

    // The user is now signed in, you can obtain the session if needed
    // const session = await getSession(); // Use getSession to get the session information if needed

    return { message: 'User created and signed in successfully', user: result.rows[0] };
  } catch (error) {
    // Handle errors for user creation or sign-in
    console.error('Failed to create or sign in user:', error);
    return {
      message: `Failed to create or sign in user: ${error.message}`,
    };
  }
}

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}


export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice' };
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}