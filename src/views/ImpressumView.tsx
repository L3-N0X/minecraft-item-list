import React from 'react'
import { GlassPanel } from '@/components/detailpanel/GlassPanel'

export function ImpressumView() {
    return (
        <div className="flex flex-col items-center pt-8 min-h-[85vh] gap-6 max-w-4xl mx-auto w-full pb-20">
            <div className="w-full space-y-6">
                {/* Main Title */}
                <div className="text-center space-y-2 mb-4">
                    <h1 className="text-4xl font-black tracking-tight">
                        Impressum
                    </h1>
                    <p className="text-muted-foreground text-base">
                        Legal Notice & Privacy Policy
                    </p>
                </div>

                {/* Legal Notice Panel */}
                <GlassPanel className="w-full">
                    <div className="px-6 py-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold mb-3 text-foreground">
                                Impressum / Legal Notice
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                Information pursuant to § 5 DDG (Angaben gemäß § 5 DDG)
                            </p>
                            <address className="not-italic text-foreground/90 space-y-1">
                                <div className="font-semibold">Leon Gött</div>
                                <div>Am Bug 36</div>
                                <div>86757 Wallerstein</div>
                                <div>Germany</div>
                            </address>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-foreground">
                                Contact (Kontakt)
                            </h3>
                            <div className="text-foreground/90 space-y-1">
                                <div>
                                    <span className="text-muted-foreground">Phone:</span>{' '}
                                    +49 159 0 266 7509
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Email:</span>{' '}
                                    <a
                                        href="mailto:leon.mc-items@goett.top"
                                        className="text-primary hover:underline"
                                    >
                                        leon.mc-items@goett.top
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-foreground">
                                Responsible for content (Verantwortlich für den Inhalt)
                            </h3>
                            <address className="not-italic text-foreground/90 space-y-1">
                                <div className="font-semibold">Leon Gött</div>
                                <div>Am Bug 36</div>
                                <div>86757 Wallerstein</div>
                                <div>Germany</div>
                            </address>
                        </div>
                    </div>
                </GlassPanel>

                {/* Privacy Policy Panel */}
                <GlassPanel className="w-full">
                    <div className="px-6 py-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold mb-3 text-foreground">
                                Privacy Policy / Datenschutzerklärung
                            </h2>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-foreground">
                                1. General Information and Data Controller
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Allgemeine Hinweise und Verantwortlicher
                            </p>
                            <p className="text-foreground/90 mb-3">
                                The responsible party for data processing on this website is:
                            </p>
                            <address className="not-italic text-foreground/90 space-y-1 mb-4">
                                <div className="font-semibold">Leon Gött</div>
                                <div>Am Bug 36</div>
                                <div>86757 Wallerstein</div>
                                <div>Germany</div>
                                <div>
                                    <span className="text-muted-foreground">Email:</span>{' '}
                                    <a
                                        href="mailto:leon.mc-items@goett.top"
                                        className="text-primary hover:underline"
                                    >
                                        leon.mc-items@goett.top
                                    </a>
                                </div>
                            </address>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-foreground">
                                2. Hosting via GitHub Pages
                            </h3>
                            <p className="text-foreground/90 mb-3">
                                This website is hosted on GitHub Pages. The provider is GitHub Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA.
                            </p>
                            <p className="text-foreground/90 mb-3">
                                When you visit this website, GitHub automatically collects and stores information in so-called server log files, which your browser automatically transmits. These include:
                            </p>
                            <ul className="list-disc list-inside text-foreground/90 space-y-1 mb-3 ml-2">
                                <li>Your IP address</li>
                                <li>Browser type and browser version</li>
                                <li>Operating system used</li>
                                <li>Referrer URL (the previously visited page)</li>
                                <li>Time of the server request</li>
                            </ul>
                            <p className="text-foreground/90 mb-3">
                                This data is not merged with other data sources. The collection of this data is based on Art. 6(1)(f) GDPR (Datenschutz-Grundverordnung). The website operator has a legitimate interest in the technically error-free presentation and optimization of the website – for this purpose, the server log files must be recorded by the hosting provider.
                            </p>
                            <p className="text-foreground/90">
                                For more information on how GitHub handles user data, please refer to the GitHub Privacy Statement:{' '}
                                <a
                                    href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline break-all"
                                >
                                    https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement
                                </a>
                            </p>
                        </div>
                    </div>
                </GlassPanel>
            </div>
        </div>
    )
}
