import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ChevronRight } from "lucide-react";
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
          <Link href="/blog" className="text-sm text-foreground font-medium">Blog</Link>
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

function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  }) : "";

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`}>
        <div className="group cursor-pointer p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-all h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-[10px] font-display tracking-wider uppercase text-primary border-primary/30">
              {post.category || "General"}
            </Badge>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <h2 className="font-display text-xl uppercase leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-1 text-sm text-primary font-medium mt-auto">
            Read more <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`}>
      <div className="group cursor-pointer p-5 rounded-lg border border-border bg-card hover:border-primary/40 transition-all flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] font-display tracking-wider uppercase text-primary border-primary/30">
              {post.category || "General"}
            </Badge>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <h3 className="font-semibold text-sm leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{post.excerpt}</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
    queryFn: async () => {
      const res = await fetch("/api/blog");
      return res.json();
    },
  });

  const featuredPosts = posts?.slice(0, 2) ?? [];
  const remainingPosts = posts?.slice(2) ?? [];

  return (
    <div className="min-h-screen bg-background" data-testid="blog-page">
      <BlogNavbar />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <p className="text-xs font-display tracking-widest text-primary uppercase mb-3">Blog</p>
            <h1 className="font-display text-3xl sm:text-4xl uppercase leading-tight">
              FREELANCE INSIGHTS &amp;{" "}
              <span className="text-primary">PROTECTION GUIDES</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl">
              Practical advice on contracts, payments, client management, and protecting your freelance income.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">✍️</p>
              <h3 className="font-semibold mb-2">No posts yet</h3>
              <p className="text-sm text-muted-foreground">Check back soon — articles are on their way.</p>
            </div>
          ) : (
            <>
              {/* Featured posts: large cards */}
              {featuredPosts.length > 0 && (
                <div className={`grid gap-6 mb-8 ${featuredPosts.length === 1 ? "grid-cols-1 max-w-2xl" : "md:grid-cols-2"}`}>
                  {featuredPosts.map((post) => (
                    <PostCard key={post.id} post={post} featured />
                  ))}
                </div>
              )}

              {/* Remaining posts: list */}
              {remainingPosts.length > 0 && (
                <div className="space-y-3">
                  {remainingPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
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
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
