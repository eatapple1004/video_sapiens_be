class MergedSearchAndAnalyzedResultDTO {
    constructor({ 
      searchResult, 
      analyzedResult 
    }) {
      this.search_result = searchResult;
      this.analyzed_result = analyzedResult;
    }
  }
  
module.exports = MergedSearchAndAnalyzedResultDTO;
  