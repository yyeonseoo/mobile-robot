package com.temi.stamprally.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PokedexEntry {

  private int number;
  private String name = "";
  private String category = "";
  private List<String> types = List.of();
  private String description = "";
  private List<String> strongAgainst = List.of();
  private List<String> weakAgainst = List.of();
  private String queryAnswer = "";

  public int getNumber() {
    return number;
  }

  public void setNumber(int number) {
    this.number = number;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public List<String> getTypes() {
    return types;
  }

  public void setTypes(List<String> types) {
    this.types = types != null ? types : List.of();
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public List<String> getStrongAgainst() {
    return strongAgainst;
  }

  public void setStrongAgainst(List<String> strongAgainst) {
    this.strongAgainst = strongAgainst != null ? strongAgainst : List.of();
  }

  public List<String> getWeakAgainst() {
    return weakAgainst;
  }

  public void setWeakAgainst(List<String> weakAgainst) {
    this.weakAgainst = weakAgainst != null ? weakAgainst : List.of();
  }

  public String getQueryAnswer() {
    return queryAnswer;
  }

  public void setQueryAnswer(String queryAnswer) {
    this.queryAnswer = queryAnswer;
  }
}
