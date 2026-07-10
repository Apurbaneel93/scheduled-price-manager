import { useMemo } from "react";

export default function ProductSelector({
  products,
  search,
  setSearch,
  selectedCollection,
  setSelectedCollection,
  selectedProductIds,
  setSelectedProductIds,
}) {
  const collections = useMemo(() => {
    return Array.from(
      new Map(
        products
          .flatMap((product) => product.collections?.nodes || [])
          .map((collection) => [collection.id, collection])
      ).values()
    ).sort((a, b) => a.title.localeCompare(b.title));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCollection =
        !selectedCollection ||
        product.collections?.nodes?.some(
          (collection) => collection.id === selectedCollection
        );

      return matchesSearch && matchesCollection;
    });
  }, [products, search, selectedCollection]);

  const filteredIds = filteredProducts.map((p) => p.id);

  const allVisibleSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selectedProductIds.includes(id));

  function toggleProduct(id) {
    setSelectedProductIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function selectVisible() {
    setSelectedProductIds((current) =>
      Array.from(new Set([...current, ...filteredIds]))
    );
  }

  function clearVisible() {
    setSelectedProductIds((current) =>
      current.filter((id) => !filteredIds.includes(id))
    );
  }

  function clearAll() {
    setSelectedProductIds([]);
  }

  function selectCollectionProducts() {
    if (!selectedCollection) return;

    const ids = products
      .filter((product) =>
        product.collections?.nodes?.some(
          (collection) => collection.id === selectedCollection
        )
      )
      .map((product) => product.id);

    setSelectedProductIds((current) =>
      Array.from(new Set([...current, ...ids]))
    );
  }

  return (
    <div className="campaign-card">
      <div className="card-header">
        <h2>Select Products</h2>

        <span>{selectedProductIds.length} Selected</span>
      </div>

      <input
        className="product-search"
        placeholder="Search Products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="selection-toolbar">
        <select
          className="form-control"
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          style={{ maxWidth: 280 }}
        >
          <option value="">All Collections</option>

          {collections.map((collection) => (
            <option
              key={collection.id}
              value={collection.id}
            >
              {collection.title}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={selectCollectionProducts}
          disabled={!selectedCollection}
        >
          Select Collection
        </button>

        <button
          type="button"
          onClick={
            allVisibleSelected
              ? clearVisible
              : selectVisible
          }
        >
          {allVisibleSelected
            ? "Clear Visible"
            : "Select Visible"}
        </button>

        <button
          type="button"
          onClick={clearAll}
          disabled={!selectedProductIds.length}
        >
          Clear All
        </button>
      </div>

      <div className="selection-count">
        Selected {selectedProductIds.length} of{" "}
        {products.length}
      </div>

      <div className="product-list">
        {filteredProducts.map((product) => (
          <label
            className="product-item"
            key={product.id}
          >
            <input
              type="checkbox"
              checked={selectedProductIds.includes(
                product.id
              )}
              onChange={() =>
                toggleProduct(product.id)
              }
            />

            <div className="product-info">
              <div className="product-title">
                {product.title}
              </div>

              <div className="product-price">
                $
                {product.variants.nodes[0]?.price ??
                  "0.00"}
              </div>
            </div>
          </label>
        ))}

        {!filteredProducts.length && (
          <div className="product-item">
            No Products Found
          </div>
        )}
      </div>
    </div>
  );
}