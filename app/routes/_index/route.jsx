import { redirect } from "react-router";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  // If Shopify passes shop parameter, preserve it
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  // Otherwise go directly to app dashboard
  throw redirect("/app");
};

export default function Index() {
  return null;
}