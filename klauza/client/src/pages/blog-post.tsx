import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import type { BlogPost } from "@shared/schema";

function BlogNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">K</span>
            </div>
            <span className="font-display text-sm tracking-[0.3em] text-foreground">K L A U Z A</span>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
          <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
        </div>
        <Link href="/auth">
          <button className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm px-5 h-9 font-medium transition-colors">
            Start Free
          </button>
        </Link>
      </div>
    </nav>
  );
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: ["/api/blog", slug],
    queryFn: async () => {
      const res = await fetch(`/api/blog/${slug}`);
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const date = post?.createdAt ? new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  }) : "";

  return (
    <div className="min-h-screen bg-background" data-testid="blog-post-page">
      <BlogNavbar />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <Link href="/blog">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Blog
            </button>
          </Link>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-32" />
              <div className="space-y-3 pt-4">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            </div>
          ) : isError || !post ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">📄</p>
              <h3 className="font-semibold mb-2">Post not found</h3>
              <p className="text-sm text-muted-foreground mb-4">This post may have been removed or doesn't exist.</p>
              <Link href="/blog">
                <button className="text-sm text-primary hover:underline">← Back to Blog</button>
              </Link>
            </div>
          ) : (
            <article>
              {/* Meta */}
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="text-[10px] font-display tracking-wider uppercase text-primary border-primary/30">
                  {post.category || "General"}
                </Badge>
                <span className="text-xs text-muted-foreground">{date}</span>
              </div>

              {/* Title */}
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase leading-tight mb-6">
                {post.title}
              </h1>

              {/* Excerpt (summary) */}
              {post.excerpt && (
                <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4 mb-8">
                  {post.excerpt}
                </p>
              )}

              {/* Divider */}
              <div className="border-t border-border mb-8" />

              {/* Content */}
              <div className="prose prose-sm max-w-none">
                {post.content.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-12 p-6 rounded-xl border border-border bg-card">
                <p className="font-display text-sm uppercase tracking-wider mb-2">Protect your freelance income</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Klauza gives you the tools to manage contracts, track clients, and enforce payments — all in one place.
                </p>
                <Link href="/auth">
                  <button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-6 h-9 font-medium transition-colors">
                    Start for Free
                  </button>
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[10px]">K</span>
            </div>
            <span className="font-display text-xs tracking-[0.2em]">KLAUZA</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Klauza. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
