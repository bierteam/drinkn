<template>
  <div class="about">
    <div>
      <multiselect
        v-model="selectedIngredients"
        :options="ingredients"
        :searchable="true"
        :multiple="true"
        :close-on-select="true"
        :show-labels="false"
        placeholder="Pick a value"
        @input="retrieveCocktailsByIngredients"
      ></multiselect>
    </div>

    <input id="txtName" @keyup="filterData" v-model="txtInput" type="text" placeholder="Search.." />
    <div class="cocktails">
      <div class="cocktail" v-for="cocktail in filterCocktails" :key="cocktail.idDrink">
        <!-- <img src="../assets/placeholder.png" /> -->
        <div>{{cocktail.strDrink}}({{cocktail.idDrink}})</div>
        <ul>
          <div class="cocktail" v-for="(ingredient, index) in cocktail.ingredients" :key="index">
            <li>{{ingredient}}</li>
          </div>
        </ul>
      <div>{{cocktail.strInstructions}}</div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import Multiselect from "vue-multiselect";

export default {
  components: { Multiselect },
  data() {
    return {
      txtInput: "",
      filteredCocktails: [],
      cocktails: [],
      ingredients: [],
      selectedIngredients: [],
      myCocktails: []
    };
  },
  methods: {
    filterData() {
      if (this.txtInput) {
        this.filteredCocktails = this.filteredCocktails.filter(cocktail =>
          cocktail.strDrink.toLowerCase().includes(this.txtInput.toLowerCase())
        );
      }
    },
    retrieveCocktailsByIngredients() {
      axios
        .post("http://localhost:3000/cocktail/personal", this.selectedIngredients)
        .then(response => (this.myCocktails = response.data));
    }
  },
  computed: {
    filterCocktails: function() {
      let data;
      if (this.myCocktails.length > 0) {
        data = this.myCocktails.filter(cocktail =>
          cocktail.strDrink.toLowerCase().includes(this.txtInput.toLowerCase()));
      } else {
        data = this.cocktails.filter(cocktail =>
          cocktail.strDrink.toLowerCase().includes(this.txtInput.toLowerCase()));
      }
      return data;
    }
  },
  created() {
    axios
      .get("http://localhost:3000/cocktail")
      .then(response => (this.cocktails = response.data));
    axios
      .get("http://localhost:3000/ingredient")
      .then(
        response =>
          (this.ingredients = response.data.map(obj => obj.ingredient))
      );
  }
};
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial;
}

.header {
  text-align: center;
  padding: 32px;
}

.cocktails {
  display: flex;
  flex-wrap: wrap;
  padding: 0 4px;
}

.cocktail {
  flex: 25%;
  max-width: 25%;
  padding: 0 4px;
}

.cocktail img {
  margin-top: 8px;
  vertical-align: middle;
  /* width: 100%; */
}

@media screen and (max-width: 800px) {
  .cocktail {
    -ms-flex: 50%;
    flex: 50%;
    /* max-width: 50%; */
  }
}

@media screen and (max-width: 600px) {
  .cocktail {
    -ms-flex: 100%;
    flex: 100%;
    /* max-width: 100%; */
  }
}
</style>
