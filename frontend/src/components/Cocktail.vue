<template>
  <div class="about">
    <div>
      <b-form-input v-model="txtInput" @keyup="filterData" placeholder="Search.." id="txtname"></b-form-input>
      <multiselect
        v-model="selectedIngredients"
        :options="ingredients"
        :searchable="true"
        :multiple="true"
        :close-on-select="true"
        :show-labels="false"
        style="margin-bottom: 20px;"
        placeholder="Pick a value"
        @input="retrieveCocktailsByIngredients"
      ></multiselect>
    </div>
    <div></div>
    <div class="cocktails">
      <b-card-group>
        <div class="cocktail" v-for="cocktail in filterCocktails" :key="cocktail.idDrink">
          <!-- <img src="../assets/placeholder.png" /> -->
          <div>
            <b-card
              title
              img-src="https://picsum.photos/600/300/?image=25"
              img-alt="Image"
              img-top
              tag="article"
              style="max-width: 20rem; margin-right:25px; margin-left: 25px;"
              class="mb-2"
            >
              <b-card-text>{{cocktail.strDrink}}</b-card-text>
              <b-card-text>
                <ul>
                    <li
                      v-for="(ingredient, index) in cocktail.ingredients"
                      :key="index"
                    >{{ingredient}}</li>
                </ul>
              </b-card-text>

              <b-col md="3" class="py-3">
                <b-button
                  v-b-popover.hover.bottom="'Just mix it all'"
                  title="Ingredients"
                  variant="primary"
                >Show instructions</b-button>
              </b-col>
            </b-card>
          </div>
        </div>
      </b-card-group>
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
      myCocktails: [],
      show: false
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
        .post("/api/v2/mix/personal", this.selectedIngredients)
        .then(response => (this.myCocktails = response.data));
    }
  },
  computed: {
    filterCocktails: function() {
      let data;
      if (this.myCocktails.length > 0) {
        data = this.myCocktails.filter(cocktail =>
          cocktail.strDrink.toLowerCase().includes(this.txtInput.toLowerCase())
        );
      } else {
        data = this.cocktails.filter(cocktail =>
          cocktail.strDrink.toLowerCase().includes(this.txtInput.toLowerCase())
        );
      }
      return data;
    }
  },
  created() {
    axios
      .get("/api/v2/mix/cocktail")
      .then(response => (this.cocktails = response.data));
    axios
      .get("/api/v2/mix/ingredient")
      .then(
        response =>
          (this.ingredients = response.data.map(obj => obj.ingredient))
      );
  }
};
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>



<style>
li {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.mr-1 {
  margin-right: 10 !important;
}

input#txtname {
  margin-bottom: 10px;
}
</style>
