"use server";

import type { Post } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import paths from "@/path";

const createPostSchema = z.object({
  title: z.string().min(3),
  // .regex(/^[a-z-]+$/, { message: "must be lowercase letters and hyphens without spaces" }),
  content: z.string().min(10),
});

interface CreatePostFormState {
  errors: {
    title?: string[];
    content?: string[];
    _form?: string[];
  };
}

export async function createPost(
  slug: string,
  formState: CreatePostFormState,
  formData: FormData
): Promise<CreatePostFormState> {
  const result = createPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const session = await auth();
  if (!session || !session.user) {
    return {
      errors: {
        _form: ["You must be logged in to create a post"],
      },
    };
  }

  const topic = await db.topic.findFirst({
    where: { slug },
  });
  if (!topic) {
    return {
      errors: {
        _form: ["Topic not found"],
      },
    };
  }

  let post: Post;
  try {
    
    post = await db.post.create({
      data: {
        title: result.data.title,
        content: result.data.content,
        topicId: topic.id,
        userId: session.user.id,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return {
        errors: {
          _form: [err.message],
        },
      };
    } else {
      return {
        errors: {
          _form: ["Failed to create post"],
        },
      };
    }
  }


  revalidatePath(paths.topicShow(slug));
  redirect(paths.postShow(slug, post.id));

}
