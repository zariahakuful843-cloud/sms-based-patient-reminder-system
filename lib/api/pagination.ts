export type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

export function getPagination(searchParams: URLSearchParams, defaultLimit = 20): Pagination {
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? String(defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
