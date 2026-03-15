/**
 * getPagination
 * Parses ?page and ?limit query params and returns
 * Mongoose-compatible skip/limit values + response metadata.
 *
 * Defaults: page=1, limit=20. Max limit capped at 100.
 *
 * @param {object} query - Express req.query
 * @returns {{ page, limit, skip, getPaginationMeta }}
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  /**
   * getPaginationMeta
   * Call after running countDocuments() to build the response envelope.
   *
   * @param {number} total - total matching documents
   * @returns {{ total, page, limit, pages, hasNext, hasPrev }}
   */
  const getPaginationMeta = (total) => ({
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  });

  return { page, limit, skip, getPaginationMeta };
};

module.exports = { getPagination };
