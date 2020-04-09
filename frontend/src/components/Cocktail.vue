<template>
  <div class="about">
    <div>
      <b-form-input v-model="txtInput" @input="retrieveSingleCocktailByName(txtInput)" placeholder="Search.." id="txtname"></b-form-input>
      <multiselect
        v-model="selectedIngredients"
        :options="ingredients"
        :searchable="true"
        :multiple="true"
        :close-on-select="true"
        :show-labels="false"
        style="margin-bottom: 20px; width 50%;"
        placeholder="Select ingredients"
        @input="retrieveCocktailsByIngredients"
      ></multiselect>
      <!-- </div> -->
    </div>
    <div></div>
    <div class="cocktails">
      <b-card-group>
        <div class="cocktail" v-for="cocktail in filterCocktails" :key="cocktail.idDrink">
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
                <div>Ingredients:</div>
                <ul>
                  <li
                    v-for="(ingredient, index) in cocktail.ingredients"
                    :key="index"
                  >{{ingredient}}</li>
                </ul>
              </b-card-text>

              <b-col md="3" class="py-3">
                <b-button
                  v-b-popover.hover.bottom="cocktail.strInstructions"
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
      show: false,
      pageSize: 50
    };
  },
  methods: {
    retrieveCocktailsAndIngredients(pageSize){
      const cocktailUrl = `/api/v2/mix/cocktail?pagesize=${pageSize}`
      console.log(cocktailUrl)
      const ingredientUrl = "/api/v2/mix/ingredient"
      const cocktailRequest = axios.get(cocktailUrl, { headers: { authorization: this.$cookie.get("token") }});
      const ingredientRequest = axios.get(ingredientUrl, this.$cookie.get('token'));
      axios.all([cocktailRequest, ingredientRequest]).then(axios.spread((...responses) => {
        if(responses[0].status !== 200 || responses[1].status !== 200){
          window.location.href = "http://localhost:8080/Login"
        }
        this.cocktails = responses[0].data
        this.ingredients = responses[1].data.map(obj => obj.ingredient)
        })).catch(errors => {
          window.location.href = "http://localhost:8080/Login"
        })
    },
    retrieveCocktailsByIngredients() {
      axios
        .post("/api/v2/mix/cocktail/personal", this.selectedIngredients)
        .then(response => (this.myCocktails = response.data));
    },
    retrieveSingleCocktailByName(cocktailName){
      axios
        .get(`/api/v2/mix/cocktail/${cocktailName}`)
        .then(response => (this.myCocktails = response.data));
    },
    handleScroll () {
      //Bottom of the page
      if ((window.innerHeight + window.scrollY + 10) >= document.body.offsetHeight) {
        this.pageSize += 50;
        this.retrieveCocktailsAndIngredients(this.pageSize);
    }
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
    window.addEventListener('scroll', this.handleScroll);
    this.retrieveCocktailsAndIngredients(this.pageSize);
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
    display: inline-block;
    width: 80%;
}
.multiselect{
    display: inline-block;
    width: 80%;
}
</style>
