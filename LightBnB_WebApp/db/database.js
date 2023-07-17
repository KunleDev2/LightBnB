const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});

pool.query(`SELECT title FROM properties LIMIT 10;`)
  .then(
    response => {

    });

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const queryString = `
  SELECT * FROM users 
  WHERE email = $1;
  `;
  const values = [email];

  return pool.query(queryString, values)
    .then((result) => {
      if (result) {
        return Promise.resolve(result.rows[0]);
      }
      else {
        return null;
      };
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryString = `
  SELECT * FROM users 
  WHERE id = $1;
  `;
  const values = [id];

  return pool.query(queryString, values)
    .then((result) => {
      return Promise.resolve(result.rows[0]);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const get_name = user.name;
  const get_email = user.email;
  const get_password = user.password;

  const queryString = `
  INSERT INTO users (name, email, password) VALUES ($1, $2, $3)
  RETURNING *;
  `;
  const values = [get_name, get_email, get_password];

  return pool.query(queryString, values)
    .then((result) => {
      return Promise.resolve(result.rows[0]);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const queryString = `
  SELECT reservations.*, properties.*, avg(property_reviews.rating) as average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = $1
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT $2;
  `;
  const values = [guest_id, limit];

  return pool.query(queryString, values)
    .then((result) => {
      return Promise.resolve(result.rows);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {

  const initQueryString = [];

  // const queryString = `
  // SELECT * FROM properties 
  // LIMIT $1;
  // `;

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    initQueryString.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${initQueryString.length} `;
  };

  if (options.guest_id) {
    initQueryString.push(`${options.guest_id}`);
    queryString += `WHERE guest_id = $${initQueryString.length} `;
  };

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    initQueryString.push(`${options.minimum_price_per_night * 100}`);
    initQueryString.push(`${options.maximum_price_per_night * 100}`);
    queryString += `WHERE cost_per_night BETWEEN $${initQueryString.length - 1} AND $${initQueryString.length}`;
  };

  if (options.minimum_rating) {
    initQueryString.push(`${options.minimum_rating}`);
    queryString += `WHERE property_reviews.rating >= $${initQueryString.length} `;
  };

  initQueryString.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${initQueryString.length};
  `;

  // console.log(queryString, initQueryString);

  // const values = [limit];

  return pool.query(queryString, initQueryString)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  
  const queryString = `
  INSERT INTO properties (owner_id,title,description,thumbnail_photo_url,cover_photo_url,cost_per_night,street,city,province,post_code,country,parking_spaces,number_of_bathrooms,number_of_bedrooms) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
  `;
  const values = [property.owner_id,property.title,property.description,property.thumbnail_photo_url,property.cover_photo_url,property.cost_per_night,property.street,property.city,property.province,property.post_code,property.country,property.parking_spaces,property.number_of_bathrooms,property.number_of_bedrooms];

  return pool.query(queryString, values)
    .then((result) => { 
      return Promise.resolve(result.rows[0]);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
