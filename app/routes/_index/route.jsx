import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";
import logo from "../../../assets/images/scheduled-price-manager-icon.png";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGlow}></div>

      <section className={styles.hero}>
        <img
          src={logo}
          alt="Scheduled Price Manager"
          className={styles.logo}
        />

        <h1 className={styles.heading}>
          Scheduled Price Manager
        </h1>

        <p className={styles.subtitle}>
          Automate product pricing, flash sales, and promotional campaigns.
          Schedule price changes once and let your Shopify store run itself.
        </p>

        {showForm && (
          <Form
            className={styles.form}
            method="post"
            action="/auth/login"
          >
            <input
              className={styles.input}
              type="text"
              name="shop"
              placeholder="your-store.myshopify.com"
            />

            <button
              className={styles.button}
              type="submit"
            >
              Install App
            </button>
          </Form>
        )}
      </section>

      <section className={styles.features}>
        <div className={styles.card}>
          <div className={styles.icon}>⏰</div>
          <h3>Schedule Sales</h3>
          <p>
            Start and stop discounts automatically at
            the exact time.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.icon}>📈</div>
          <h3>Bulk Price Updates</h3>
          <p>
            Update hundreds of products in a single
            campaign.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.icon}>🔄</div>
          <h3>Automatic Rollback</h3>
          <p>
            Restore original prices when campaigns
            end automatically.
          </p>
        </div>
      </section>

      <section className={styles.benefits}>
        <div>✅ Unlimited Scheduling</div>
        <div>✅ Shopify Plus Compatible</div>
        <div>✅ Automatic Price Restore</div>
        <div>✅ Flash Sale Automation</div>
        <div>✅ Bulk Product Updates</div>
        <div>✅ Time Zone Support</div>
      </section>

      <section className={styles.stats}>
        <div>
          <h2>24/7</h2>
          <span>Automation</span>
        </div>

        <div>
          <h2>100%</h2>
          <span>Shopify Compatible</span>
        </div>

        <div>
          <h2>∞</h2>
          <span>Scheduled Campaigns</span>
        </div>
      </section>

      <section className={styles.cta}>
        <h2>Ready to Automate Your Shopify Pricing?</h2>

        <p>
          Create sales campaigns in minutes and let
          Scheduled Price Manager handle the rest.
        </p>

        {showForm && (
          <Form method="post" action="/auth/login">
            <input
              className={styles.input}
              type="text"
              name="shop"
              placeholder="your-store.myshopify.com"
            />

            <button
              className={styles.button}
              type="submit"
            >
              Get Started
            </button>
          </Form>
        )}
      </section>
    </div>
  );
}