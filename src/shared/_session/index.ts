function set(key, value) {
    sessionStorage.setItem(key,value)
  }
  
  function get(key) {
    return sessionStorage.getItem(key)
  }
  
  function clear(key) {
    sessionStorage.removeItem(key)
  }
  
  function clearAll() {
    sessionStorage.clear()
  }
  
  export const sessionService = { set, get, clear, clearAll }