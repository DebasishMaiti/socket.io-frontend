import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  heading: string;
  subheading: string;
  ctaPrimary: {
    label: string;
    href: string;
  };
  ctaSecondary: {
    label: string;
    href: string;
  };
  bgImage: string;
}

export function HeroSection({ heading, subheading, ctaPrimary, ctaSecondary, bgImage }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-hero min-h-[75vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={bgImage}
          alt="Hero background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-hero/90" />
      </div>

      {/* Content */}
      <div className="relative container py-24 lg:py-40">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Headlines */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              {heading}
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto">
              {subheading}
            </p>
          </div>

          {/* CTA */}
          <div className="flex justify-center">
            <Button size="lg" variant="default" asChild className="text-lg px-8 py-6">
              <a href={ctaPrimary.href}>{ctaPrimary.label}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
