import assert from "node:assert/strict"
import test from "node:test"

import { searchItems } from "./search-data"

const routeCases = [
  { query: "积分配置", isAdmin: true, expectedUrl: "/admin/credit" },
  { query: "通知设置", isAdmin: false, expectedUrl: "/settings/notifications" },
  { query: "安全设置", isAdmin: false, expectedUrl: "/settings/security" },
]

for (const { query, isAdmin, expectedUrl } of routeCases) {
  test(`search result for ${query} links to its page`, () => {
    const result = searchItems(query, isAdmin).find((item) => item.title === query)

    assert.ok(result, `expected an exact search result for ${query}`)
    assert.equal(result.url, expectedUrl)
  })
}
