import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/api';

const ProductList = () => {
  const [products, setProducts] = useState([])
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceFilter, setPriceFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts()
        const processedData = data.map(item => ({
          ...item,
          searchableText: `${item.name.toLowerCase()} ${item.price} ${item.stock}`,
          priceCategory: item.price < 50 ? 'cheap' : item.price < 100 ? 'medium' : 'expensive',
          stockStatus: item.stock === 0 ? 'out' : item.stock < 10 ? 'low' : 'available'
        }))
        setProducts(processedData)
      } catch (err) {
        setError('Failed to load products')
        console.error(err)
      }
    }
    fetchProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const searchFiltered = products.filter(product => {
      if (!searchTerm) return true

      const searchWords = searchTerm.toLowerCase().split(' ')

      const searchableWords = product.searchableText.split(' ')

      return searchWords.every(searchWord =>
        searchableWords.some(word => {
          const normalizedWord = word.toLowerCase().trim()
          const normalizedSearch = searchWord.toLowerCase().trim()

          // Levenshtein distance calculation for fuzzy matching
          const distance = Array(normalizedWord.length + 1).fill(null).map(() =>
            Array(normalizedSearch.length + 1).fill(null)
          )

          for (let i = 0; i <= normalizedWord.length; i++) {
            distance[i][0] = i
          }

          for (let j = 0; j <= normalizedSearch.length; j++) {
            distance[0][j] = j
          }

          for (let i = 1; i <= normalizedWord.length; i++) {
            for (let j = 1; j <= normalizedSearch.length; j++) {
              const cost = normalizedWord[i - 1] === normalizedSearch[j - 1] ? 0 : 1

              distance[i][j] = Math.min(
                distance[i - 1][j] + 1,
                distance[i][j - 1] + 1,
                distance[i - 1][j - 1] + cost
              )
            }
          }

          // Allow for fuzzy matching with a threshold
          return distance[normalizedWord.length][normalizedSearch.length] <= 2
        })
      )
    })

    const priceFiltered = searchFiltered.filter(product => {
      if (!priceFilter) return true

      const price = parseFloat(product.price)
      switch(priceFilter) {
        case 'low':
          return price < 50 && product.priceCategory === 'cheap'
        case 'medium':
          return price >= 50 && price < 100 && product.priceCategory === 'medium'
        case 'high':
          return price >= 100 && product.priceCategory === 'expensive'
        default:
          return true
      }
    })

    return priceFiltered.filter(product => {
      if (!stockFilter) return true

      const stockNum = parseInt(product.stock)

      switch(stockFilter) {
        case 'out':
          return stockNum === 0 && product.stockStatus === 'out'
        case 'low':
          return stockNum > 0 && stockNum < 10 && product.stockStatus === 'low'
        case 'available':
          return stockNum >= 10 && product.stockStatus === 'available'
        default:
          return true
      }
    })
  }, [products, searchTerm, priceFilter, stockFilter])

  return (
    <div style={{padding: '20px'}}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>Products</h2>
        <Link to="/add-product">
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Add Product
          </button>
        </Link>
      </div>

      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            flex: 1
          }}
        />

        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          <option value="">All Prices</option>
          <option value="low">Low (&lt; $50)</option>
          <option value="medium">Medium ($50 - $100)</option>
          <option value="high">High (&gt; $100)</option>
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          <option value="">All Stock</option>
          <option value="out">Out of Stock</option>
          <option value="low">Low Stock</option>
          <option value="available">Available</option>
        </select>
      </div>

      {error && <div style={{
        color: 'red',
        padding: '10px',
        backgroundColor: '#ffebee',
        marginBottom: '20px',
        borderRadius: '4px'
      }}>{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        {filteredProducts.map(product => (
          <div
            key={product.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: 'white'
            }}
          >
            <h3 style={{margin: '0 0 10px 0'}}>{product.name}</h3>
            <p style={{margin: '5px 0', color: '#666'}}>
              Price: ${product.price}
            </p>
            <p style={{
              margin: '5px 0',
              color: product.stock > 0 ? '#4CAF50' : '#f44336'
            }}>
              Stock: {product.stock}
            </p>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p style={{textAlign: 'center', color: '#666'}}>
          No products found matching your criteria
        </p>
      )}
    </div>
  );
};

export default ProductList;
