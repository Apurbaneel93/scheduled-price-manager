import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query {
      products(first: 20) {
        nodes {
          id
          title
          status
        }
      }
    }
  `);

  const responseJson = await response.json();

  return {
    products: responseJson.data.products.nodes,
  };
};

export default function ProductsPage({ loaderData }) {
  const { products } = loaderData;

  return (
    <s-page heading="Store Products">
      <s-section heading="Products from Shopify">
        <s-paragraph>
          Total Products: {products.length}
        </s-paragraph>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th align="left">Title</th>
              <th align="left">Status</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.title}</td>
                <td>{product.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </s-section>
    </s-page>
  );
}