import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
    MagnifyingGlassIcon,
    ListMagnifyingGlassIcon,
    DownloadSimpleIcon,
    CubeIcon,
    SwordIcon,
    TreasureChestIcon,
    TreeEvergreenIcon,
    SparkleIcon,
    CookingPotIcon,
    UsersThreeIcon,
    SkullIcon,
    ForkKnifeIcon,
    CaretDownIcon,
    ArrowSquareOutIcon,
    ArrowRightIcon,
    ArticleIcon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface FaqItem {
    question: string
    answer: React.ReactNode
}

const FAQ_ITEMS: FaqItem[] = [
    {
        question: 'What is Minecraft Item Search?',
        answer: (
            <>
                Minecraft Item Search is an instant, browser-based lookup tool
                and comprehensive database for every item, block, tool, entity
                drop, and game mechanic in Minecraft. Everything runs instantly
                with zero load time as you type.
            </>
        ),
    },
    {
        question: 'How do I search for items using keyboard shortcuts?',
        answer: (
            <>
                Press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono border border-border">
                    Ctrl + K
                </kbd>{' '}
                (or{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono border border-border">
                    Cmd + K
                </kbd>{' '}
                on Mac) anywhere on the page to focus the search bar. Use the{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono border border-border">
                    ↑
                </kbd>{' '}
                and{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono border border-border">
                    ↓
                </kbd>{' '}
                arrow keys to select an item, and press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono border border-border">
                    Enter
                </kbd>{' '}
                to open the complete stats panel. Press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono border border-border">
                    Esc
                </kbd>{' '}
                to exit search.
            </>
        ),
    },
    {
        question: 'What information can I look up for each item?',
        answer: (
            <>
                Each item page provides block properties (hardness, blast
                resistance, light level, harvest tools), item & combat stats
                (attack damage, armor, durability, enchantability), crafting &
                smelting recipes, loot tables (chests, trial vaults), natural
                biome generation, mob drops, and villager trades.
            </>
        ),
    },
    {
        question: 'Which Minecraft versions are supported?',
        answer: (
            <>
                The database is updated for Minecraft <strong>26.2</strong> and
                earlier releases. You can switch between supported versions at
                any time using the version selector in the top navigation bar.
            </>
        ),
    },
    {
        question: 'How do I build and export a custom item list?',
        answer: (
            <>
                Click on the <strong>Custom List</strong> tab in the navigation
                bar. Developers can filter and query the full catalog by
                properties like renewability, rarity, harvest tools, biomes, or
                dimensions, then export formatted lists of item IDs or names for
                plugins, configurations, and tools.
            </>
        ),
    },
    {
        question: 'Can I download the entire database as JSON?',
        answer: (
            <>
                Yes. Click the <strong>Download List</strong> button in the top
                bar to download the full version-specific database in
                standardized JSON format for your own mods, plugins, bots, or
                development projects.
            </>
        ),
    },
    {
        question: 'How can I report missing items, bugs, or wrong stats?',
        answer: (
            <>
                If you find a missing item, outdated stat, or bug, please open
                an issue on our{' '}
                <a
                    href="https://github.com/L3-N0X/minecraft-item-list/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline hover:opacity-80"
                >
                    GitHub Issues page
                </a>
                . Pull requests and data corrections are always welcome!
            </>
        ),
    },
]

const KEY_DATA_ELEMENTS = [
    {
        icon: CubeIcon,
        title: 'Block Properties',
        desc: 'Hardness, blast resistance, light emission, and harvest tools.',
    },
    {
        icon: SwordIcon,
        title: 'Item & Combat Stats',
        desc: 'Attack damage, armor defense, durability, and enchantability.',
    },
    {
        icon: CookingPotIcon,
        title: 'Crafting Recipes',
        desc: 'Recipes for crafting tables, furnaces, smokers, and stonecutters.',
    },
    {
        icon: TreasureChestIcon,
        title: 'Loot Tables',
        desc: 'Chest loot chances and quantities in dungeons, ancient cities, and vaults.',
    },
    {
        icon: TreeEvergreenIcon,
        title: 'World Generation',
        desc: 'Naturally generating biomes, dimensions, and structure locations.',
    },
    {
        icon: SkullIcon,
        title: 'Mob Drops',
        desc: 'Drop rates, quantities, and Looting enchantment multipliers.',
    },
    {
        icon: UsersThreeIcon,
        title: 'Villager Trading',
        desc: 'Villager offers by profession, wandering trader items, and Piglin bartering.',
    },
    {
        icon: ForkKnifeIcon,
        title: 'Food & Consumables',
        desc: 'Hunger points, saturation values, and status effects.',
    },
    {
        icon: SparkleIcon,
        title: 'Item Identifiers',
        desc: 'Namespaced IDs, stack sizes, rarity tiers, and renewability.',
    },
]

const FEATURES = [
    {
        id: 'search',
        icon: MagnifyingGlassIcon,
        title: 'Instant Search & Keyboard Navigation',
        desc: (
            <>
                Find any Minecraft item or block instantly as you type. Use{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs md:text-sm font-mono border border-border text-foreground">
                    Ctrl+K
                </kbd>{' '}
                from anywhere on the page, navigate results with arrow keys, and
                press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs md:text-sm font-mono border border-border text-foreground">
                    Enter
                </kbd>{' '}
                to open the complete stats panel.
            </>
        ),
    },
    {
        id: 'all-details',
        icon: ArticleIcon,
        title: 'All Details on One Page',
        desc: (
            <>
                Every item is packed with comprehensive information and stats
                designed for both players and developers. Our search is built to
                display all properties, recipes, drops, loot tables, and
                mechanics together on one screen—making looking up even the
                smallest details effortless and fast.
            </>
        ),
    },
    {
        id: 'custom-lists',
        icon: ListMagnifyingGlassIcon,
        title: 'Custom List Builder for Developers',
        desc: (
            <>
                Filter and query items across dozens of attributes including
                renewability, rarity tier, harvest tools, biomes, and
                dimensions. Select items in bulk to generate tailored datasets
                for development, server configurations, and plugins.
            </>
        ),
    },
    {
        id: 'export',
        icon: DownloadSimpleIcon,
        title: 'Formatted Export & JSON Database',
        desc: (
            <>
                Export custom list selections as formatted ID lists or download
                the complete versioned JSON database directly for use in your
                applications, scripts, and developer tools.
            </>
        ),
    },
]

export function LandingSeoContent() {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
    const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)
    const scrollSectionRef = useRef<HTMLDivElement>(null)
    const isClickScrollingRef = useRef(false)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [visibleElements, setVisibleElements] = useState<
        Record<string, { isVisible: boolean; delay: number }>
    >({})
    const elementRefs = useRef<Map<string, HTMLElement>>(new Map())

    const registerElement = (id: string) => (el: HTMLElement | null) => {
        if (el) {
            elementRefs.current.set(id, el)
        } else {
            elementRefs.current.delete(id)
        }
    }

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index)
    }

    useEffect(() => {
        const elements = Array.from(elementRefs.current.values())
        if (elements.length === 0) return

        if (typeof IntersectionObserver === 'undefined') {
            const allVisible: Record<
                string,
                { isVisible: boolean; delay: number }
            > = {}
            elementRefs.current.forEach((_, id) => {
                allVisible[id] = { isVisible: true, delay: 0 }
            })
            setVisibleElements(allVisible)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const newlyIntersecting: {
                    id: string
                    top: number
                    left: number
                }[] = []
                const leaving: string[] = []

                entries.forEach((entry) => {
                    const id = entry.target.getAttribute('data-reveal-id')
                    if (!id) return

                    if (entry.isIntersecting) {
                        newlyIntersecting.push({
                            id,
                            top: entry.boundingClientRect.top,
                            left: entry.boundingClientRect.left,
                        })
                    } else {
                        leaving.push(id)
                    }
                })

                if (newlyIntersecting.length > 0 || leaving.length > 0) {
                    // Sort top-to-bottom, left-to-right so stagger flows naturally
                    newlyIntersecting.sort((a, b) => {
                        if (Math.abs(a.top - b.top) > 50) {
                            return a.top - b.top
                        }
                        return a.left - b.left
                    })

                    setVisibleElements((prev) => {
                        const next = { ...prev }

                        // Reset leaving elements with 0ms delay so they can re-animate smoothly on scroll
                        leaving.forEach((id) => {
                            next[id] = { isVisible: false, delay: 0 }
                        })

                        // Apply clear, visible stagger delay (75ms per element) for newly intersecting batch
                        newlyIntersecting.forEach(({ id }, batchOrder) => {
                            if (!prev[id]?.isVisible) {
                                next[id] = {
                                    isVisible: true,
                                    delay: batchOrder * 75,
                                }
                            }
                        })

                        return next
                    })
                }
            },
            {
                rootMargin: '0px 0px -50px 0px',
                threshold: 0.15,
            }
        )

        elements.forEach((el) => observer.observe(el))

        return () => {
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            if (!scrollSectionRef.current || isClickScrollingRef.current) return
            const rect = scrollSectionRef.current.getBoundingClientRect()
            const windowHeight = window.innerHeight
            const topOffset = 120
            const scrolled = topOffset - rect.top
            const totalScrollable = rect.height - windowHeight

            if (totalScrollable <= 0) return

            const progress = Math.max(
                0,
                Math.min(1, scrolled / totalScrollable)
            )
            if (progress < 0.25) {
                setActiveFeatureIndex(0)
            } else if (progress < 0.5) {
                setActiveFeatureIndex(1)
            } else if (progress < 0.75) {
                setActiveFeatureIndex(2)
            } else {
                setActiveFeatureIndex(3)
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()
        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        }
    }, [])

    const handleFeatureClick = (index: number) => {
        setActiveFeatureIndex(index)
        if (!scrollSectionRef.current) return

        isClickScrollingRef.current = true
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = setTimeout(() => {
            isClickScrollingRef.current = false
        }, 700)

        const rect = scrollSectionRef.current.getBoundingClientRect()
        const topOffset = 120
        const totalScrollable =
            scrollSectionRef.current.offsetHeight - window.innerHeight
        if (totalScrollable > 0) {
            const targetProgress =
                index === 0
                    ? 0.05
                    : index === 1
                      ? 0.35
                      : index === 2
                        ? 0.65
                        : 0.92
            const targetScroll =
                window.scrollY +
                rect.top -
                topOffset +
                targetProgress * totalScrollable
            window.scrollTo({ top: targetScroll, behavior: 'smooth' })
        }
    }

    const activeFeature =
        FEATURES[activeFeatureIndex] ?? (FEATURES[0] as (typeof FEATURES)[0])

    return (
        <section
            aria-label="Minecraft Item Search Guide and Information"
            className="w-full max-w-4xl text-left"
        >
            {/* 1. INTRO HEADER */}
            <div className="text-center space-y-3 pt-2">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                    What is Item Search?
                </h2>
                <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                    A fast lookup engine and database for Minecraft items,
                    blocks, and game mechanics.
                </p>
            </div>

            {/* 2. SCROLL-DRIVEN FEATURE SECTION WITH HORIZONTAL STRIPE */}
            <div
                ref={scrollSectionRef}
                className="relative h-[280vh] mt-20 md:mt-28"
            >
                <div className="sticky top-28 md:top-36">
                    <div className="min-h-[220px] md:min-h-[240px] flex flex-col items-center text-center gap-6 md:gap-7 w-full">
                        {/* Horizontal Icon Stripe with Animated Square Indicator */}
                        <div className="relative inline-flex items-center p-1.5 rounded-2xl bg-background/80 dark:bg-muted/40 border border-border/60 dark:border-white/10 backdrop-blur-sm shadow-xs">
                            {/* Animated Sliding Background Square */}
                            <div
                                className="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl bg-primary shadow-sm transition-transform duration-300 ease-out pointer-events-none"
                                style={{
                                    width: `calc((100% - 12px) / ${FEATURES.length})`,
                                    transform: `translateX(calc(${activeFeatureIndex} * 100%))`,
                                }}
                            />

                            {FEATURES.map((feat, idx) => {
                                const isActive = activeFeatureIndex === idx
                                const Icon = feat.icon
                                return (
                                    <button
                                        key={feat.id}
                                        type="button"
                                        onClick={() => handleFeatureClick(idx)}
                                        title={feat.title}
                                        aria-label={feat.title}
                                        className={cn(
                                            'h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl flex items-center justify-center relative z-10 transition-colors duration-200 cursor-pointer',
                                            isActive
                                                ? 'text-primary-foreground font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                                    </button>
                                )
                            })}
                        </div>

                        {/* Active Tab Details */}
                        <div className="space-y-3 pt-1 w-full max-w-2xl mx-auto">
                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground transition-all duration-300">
                                {activeFeature.title}
                            </h3>
                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed transition-all duration-300">
                                {activeFeature.desc}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. KEY DATABASE ELEMENTS (CONCISE OVERVIEW GRID) */}
            <div className="space-y-6 mt-28 md:mt-40">
                <div
                    ref={registerElement('elements-header')}
                    data-reveal-id="elements-header"
                    style={{
                        transitionDelay: visibleElements['elements-header']
                            ?.isVisible
                            ? `${visibleElements['elements-header']?.delay ?? 0}ms`
                            : '0ms',
                    }}
                    className={cn(
                        'transition-[opacity,transform] duration-500 ease-out will-change-[opacity,transform]',
                        visibleElements['elements-header']?.isVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-6 pointer-events-none'
                    )}
                >
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                        What's in the List?
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        An overview of the properties and stats included for
                        every item and block in our database:
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {KEY_DATA_ELEMENTS.map((elem, idx) => {
                        const id = `element-card-${idx}`
                        const cardState = visibleElements[id]
                        const isVisible = cardState?.isVisible ?? false
                        const delay = cardState?.delay ?? 0

                        return (
                            <div
                                key={idx}
                                ref={registerElement(id)}
                                data-reveal-id={id}
                                style={{
                                    transitionDelay: isVisible
                                        ? `${delay}ms`
                                        : '0ms',
                                }}
                                className={cn(
                                    'p-5 md:p-6 rounded-2xl bg-background/40 border border-border/60 dark:border-white/10 space-y-2.5 hover:border-primary/40',
                                    'transition-[opacity,transform,border-color,background-color] duration-500 ease-out will-change-[opacity,transform]',
                                    isVisible
                                        ? 'opacity-100 translate-y-0 scale-100'
                                        : 'opacity-0 translate-y-8 scale-[0.96] pointer-events-none'
                                )}
                            >
                                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <elem.icon className="h-5 w-5" />
                                </div>
                                <h3 className="font-bold text-base md:text-lg text-foreground">
                                    {elem.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {elem.desc}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 4. CUSTOM LIST TOOLS & REPORTING ISSUES */}
            <div className="mt-16 md:mt-24 pt-12 md:pt-16 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 lg:gap-20">
                    {/* Custom List Creation */}
                    <div
                        ref={registerElement('tool-custom-list')}
                        data-reveal-id="tool-custom-list"
                        style={{
                            transitionDelay: visibleElements['tool-custom-list']
                                ?.isVisible
                                ? `${visibleElements['tool-custom-list']?.delay ?? 0}ms`
                                : '0ms',
                        }}
                        className={cn(
                            'space-y-3.5',
                            'transition-[opacity,transform] duration-500 ease-out will-change-[opacity,transform]',
                            visibleElements['tool-custom-list']?.isVisible
                                ? 'opacity-100 translate-y-0 scale-100'
                                : 'opacity-0 translate-y-8 scale-[0.97] pointer-events-none'
                        )}
                    >
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary/80 dark:text-primary/70">
                                Developer Tools
                            </span>
                            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                Custom List Builder
                            </h3>
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            A specialized tool for developers and server
                            administrators to filter, query, and select items
                            using in-depth attributes. Export formatted IDs or
                            complete JSON datasets for server configs,
                            datapacks, and plugins.
                        </p>
                        <div className="pt-1">
                            <Link
                                to="/bulk"
                                className="group inline-flex items-center gap-2 text-sm md:text-base font-semibold text-primary hover:text-primary/80 transition-colors"
                            >
                                <span>Open custom list builder</span>
                                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Report Issues on GitHub */}
                    <div
                        ref={registerElement('tool-report-issue')}
                        data-reveal-id="tool-report-issue"
                        style={{
                            transitionDelay: visibleElements[
                                'tool-report-issue'
                            ]?.isVisible
                                ? `${visibleElements['tool-report-issue']?.delay ?? 0}ms`
                                : '0ms',
                        }}
                        className={cn(
                            'space-y-3.5',
                            'transition-[opacity,transform] duration-500 ease-out will-change-[opacity,transform]',
                            visibleElements['tool-report-issue']?.isVisible
                                ? 'opacity-100 translate-y-0 scale-100'
                                : 'opacity-0 translate-y-8 scale-[0.97] pointer-events-none'
                        )}
                    >
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary/80 dark:text-primary/70">
                                Community & Accuracy
                            </span>
                            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                Report an Issue
                            </h3>
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            Notice a missing item, outdated drop rate, or
                            incorrect stat for Minecraft 26.2? Help us keep the
                            database accurate and up to date by reporting issues
                            or submitting corrections directly on GitHub.
                        </p>
                        <div className="pt-1">
                            <a
                                href="https://github.com/L3-N0X/minecraft-item-list/issues"
                                target="_blank"
                                rel="noreferrer"
                                className="group inline-flex items-center gap-2 text-sm md:text-base font-semibold text-primary hover:text-primary/80 transition-colors"
                            >
                                <span>Report on GitHub Issues</span>
                                <ArrowSquareOutIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. FREQUENTLY ASKED QUESTIONS */}
            <div className="space-y-6 mt-16 md:mt-20">
                <div
                    ref={registerElement('faq-header')}
                    data-reveal-id="faq-header"
                    style={{
                        transitionDelay: visibleElements['faq-header']
                            ?.isVisible
                            ? `${visibleElements['faq-header']?.delay ?? 0}ms`
                            : '0ms',
                    }}
                    className={cn(
                        'transition-[opacity,transform] duration-500 ease-out will-change-[opacity,transform]',
                        visibleElements['faq-header']?.isVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-6 pointer-events-none'
                    )}
                >
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Common questions about searching, filtering, and using
                        Minecraft item data.
                    </p>
                </div>

                <div className="space-y-3">
                    {FAQ_ITEMS.map((faq, index) => {
                        const id = `faq-item-${index}`
                        const itemState = visibleElements[id]
                        const isVisible = itemState?.isVisible ?? false
                        const delay = itemState?.delay ?? 0
                        const isOpen = openFaqIndex === index

                        return (
                            <div
                                key={index}
                                ref={registerElement(id)}
                                data-reveal-id={id}
                                style={{
                                    transitionDelay: isVisible
                                        ? `${delay}ms`
                                        : '0ms',
                                }}
                                className={cn(
                                    'rounded-2xl bg-background/40 border border-border/60 dark:border-white/10 overflow-hidden',
                                    'transition-[opacity,transform,border-color,background-color] duration-500 ease-out will-change-[opacity,transform]',
                                    isVisible
                                        ? 'opacity-100 translate-y-0 scale-100'
                                        : 'opacity-0 translate-y-6 scale-[0.98] pointer-events-none'
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm md:text-base text-foreground hover:text-primary transition-colors cursor-pointer"
                                    aria-expanded={isOpen}
                                >
                                    <span>{faq.question}</span>
                                    <CaretDownIcon
                                        className={cn(
                                            'h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground',
                                            isOpen && 'rotate-180 text-primary'
                                        )}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/20 animate-in fade-in-50 duration-200">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
export default LandingSeoContent
