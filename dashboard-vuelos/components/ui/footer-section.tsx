'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MapPin, Plane } from 'lucide-react';

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Proyecto',
		links: [
			{ title: 'Características', href: '#' },
			{ title: 'Precios', href: '#' },
			{ title: 'Testimonios', href: '#' },
			{ title: 'Integraciones', href: '/' },
		],
	},
	{
		label: 'Compañía',
		links: [
			{ title: 'FAQs', href: '#' },
			{ title: 'Nosotros', href: '#' },
			{ title: 'Política de Privacidad', href: '#' },
			{ title: 'Términos de Servicio', href: '#' },
		],
	},
	{
		label: 'Recursos',
		links: [
			{ title: 'Blog', href: '#' },
			{ title: 'Actualizaciones', href: '#' },
			{ title: 'Ayuda', href: '#' },
		],
	},
	{
		label: 'Social',
		links: [
			{ title: 'Facebook', href: '#' },
			{ title: 'Instagram', href: '#' },
			{ title: 'Youtube', href: '#' },
			{ title: 'LinkedIn', href: '#' },
		],
	},
];

export function Footer() {
	return (
		<footer className="md:rounded-t-[3rem] relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t border-white/10 bg-[radial-gradient(35%_128px_at_50%_0%,rgba(255,255,255,0.08),transparent)] px-6 py-12 lg:py-16 mt-20">
			<div className="bg-white/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8 hover:brightness-110 transition-all">
				<AnimatedContainer className="space-y-4">
					<div className="flex items-center gap-2 text-white">
                        <MapPin className="size-8 text-emerald-400" />
                        <span className="font-bold text-2xl tracking-tight">Vuelos</span>
                    </div>
					<p className="text-zinc-500 mt-8 text-sm md:mt-0">
						© {new Date().getFullYear()} Dashboard de Vuelos. Todos los derechos reservados.
					</p>
				</AnimatedContainer>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
					{footerLinks.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="mb-10 md:mb-0">
								<h3 className="text-xs text-white uppercase tracking-wider font-semibold">{section.label}</h3>
								<ul className="text-zinc-500 mt-4 space-y-2 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<a
												href={link.href}
												className="hover:text-white inline-flex items-center transition-all duration-300"
											>
												{link.icon && <link.icon className="me-2 size-4" />}
												{link.title}
											</a>
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
};

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className as string}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
