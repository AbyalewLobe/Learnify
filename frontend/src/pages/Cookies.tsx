import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const Cookies = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-20">
        <article className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
              <p className="text-muted-foreground">Last updated: March 15, 2024</p>
            </header>

            <section className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">What Are Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When you use and access the Service, we may place a number of cookie files in your web browser. We use cookies for the following purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>To enable certain functions of the Service</li>
                  <li>To provide analytics</li>
                  <li>To store your preferences</li>
                  <li>To enable advertisements delivery, including behavioral advertising</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
                
                <div className="space-y-6 mt-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Essential Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Analytics Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Functionality Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Targeting Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service, deliver advertisements on and through the Service, and so on. These third-party services have their own privacy policies addressing how they use such information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>For Chrome: https://support.google.com/chrome/answer/95647</li>
                  <li>For Firefox: https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox</li>
                  <li>For Safari: https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac</li>
                  <li>For Edge: https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">More Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about our Cookie Policy, please contact us at privacy@learnplatform.com
                </p>
              </section>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default Cookies;
