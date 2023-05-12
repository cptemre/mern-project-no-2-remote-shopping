import React from "react";
//* COMPONENTS
import SearchInput from "./SearchInput";
//* CSS
import "../../../../css/header/header-down/search-bar/search-bar.css";
const SearchBar = () => {
  return (
    <section id="search-bar-section">
      <SearchInput />
    </section>
  );
};

export default SearchBar;