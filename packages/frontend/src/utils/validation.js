export const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}

export const validatePassword = (password) => {
  let errors = []

  if (password.length < 8) errors.push('Password must be at least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase')
  if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase')
  if (!/[0-9]/.test(password)) errors.push('Password must contain number')

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateUser = (user) => {
  const errors = {}

  if (!user.firstname) errors.firstname = 'First name is required'
  if (!user.lastname) errors.lastname = 'Last name is required'
  if (!user.username) errors.username = 'Username is required'
  if (user.username && user.username.length < 3) errors.username = 'Username too short'

  if (user.password) {
    const passwordValidation = validatePassword(user.password)
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors
    }
  } else {
    errors.password = 'Password is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateProduct = (product) => {
  let valid = true
  let errors = {}

  if (!product.name || product.name.trim() === '') {
    valid = false
    errors.name = 'Name is required'
  }

  if (!product.price || isNaN(product.price)) {
    valid = false
    errors.price = 'Valid price is required'
  }

  if (product.price < 0) {
    valid = false
    errors.price = 'Price must be positive'
  }

  if (!product.stock || isNaN(product.stock)) {
    valid = false
    errors.stock = ['Stock must be a number']
  }

  if (product.stock < 0) {
    if (!errors.stock) errors.stock = []
    errors.stock.push('Stock cannot be negative')
  }

  return { valid, errors }
}

