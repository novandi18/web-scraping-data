import puppeteer from "puppeteer";
import fsp from "fs/promises";
import fs from "fs";
import lowonganFile from "./data.json" assert { type: "json" };
import ora from "ora";

const getData = async (id) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  await page.goto(
    `https://kerjabilitas.com/main_page/public_vacancy_detail.php?novac=${id}`,
    {
      waitUntil: "domcontentloaded",
    }
  );

  const dataLowongan = await page.evaluate(() => {
    let kriteriaUmum = [];
    let kriteriaKhusus = [];

    // Judul
    const judulLowongan = document.querySelector(
      "div:nth-child(14) > div > div:nth-child(2) > h5"
    ).innerHTML;

    const split = judulLowongan.toLowerCase().split(" ");
    const modify = split.map(
      (_, index) =>
        (split[index] =
          split[index].charAt(0).toUpperCase() + split[index].slice(1))
    );
    const judul = modify.join(" ");

    // Lokasi, Provinsi dan Disabilitas
    const deskripsiLowongan = document
      .querySelector(
        "div:nth-child(14) > div > div:nth-child(2) > p:nth-child(2)"
      )
      .innerHTML.trim()
      .split(" | ");

    const lokasi = deskripsiLowongan[1].split(" - ")[0].split("(")[0].trim();
    const provinsi = deskripsiLowongan[1].split(" - ")[1].trim();
    const disabilitas = deskripsiLowongan[2].split(",");

    // Kriteria Umum
    const listKriteriaUmum = document.querySelectorAll(
      "div:nth-child(15) > div > div > div:nth-child(3) > ol > li"
    );

    for (let i = 0; i < listKriteriaUmum.length; i++) {
      kriteriaUmum.push(
        listKriteriaUmum[i].innerHTML
          .replace(".", "")
          .replace(/\\n/g, "")
          .replace("&amp;", "&")
          .trim()
      );
    }

    // Kriteria Khusus
    const listKriteriaKhusus = document.querySelectorAll(
      "div:nth-child(15) > div > div > div:nth-child(4) > ol > li"
    );

    for (let i = 0; i < listKriteriaKhusus.length; i++) {
      kriteriaKhusus.push(
        listKriteriaKhusus[i].innerHTML
          .replace(".", "")
          .replace(/\\n/g, "")
          .replace("&amp;", "&")
          .trim()
      );
    }

    return {
      judul,
      lokasi,
      provinsi,
      disabilitas,
      kriteriaUmum,
      kriteriaKhusus,
    };
  });

  generateToJsonFile(dataLowongan, id);

  await browser.close();
};

function generateToJsonFile(lowongan, idLowongan) {
  const data = { id: idLowongan, ...lowongan };
  lowonganFile.lowongan.push(data);
  fsp
    .writeFile("data.json", JSON.stringify(lowonganFile), (err) => {
      if (err) return console.log(err);
    })
    .then(() => {
      loading.text = `Scraping data from ${idLowongan} is done`;
      loading.succeed();
    });
}

function getDataByList(txtFile) {
  try {
    const data = fs.readFileSync(`./${txtFile}`, "utf8").toString();

    if (data.length) {
      loading.text = "Successfully imported txt file";
      loading.succeed();
      data.split("\n").forEach((id) => {
        loading.text = `Scraping data from ${id}...`;
        loading.start();

        let isIdExist = Object.keys(lowonganFile.lowongan).some(
          (i) => lowonganFile.lowongan[i]["id"] === id
        );

        if (isIdExist) {
          loading.text = `Id for ${id} is already exists`;
          loading.fail();
        } else {
          loading.text = `Scraping data from ${id}...`;
          loading.start();
          getData(id);
        }
      });
    } else {
      loading.text = "Your txt file is empty";
      loading.fail();
    }
  } catch (error) {
    loading.text = error.message;
    loading.fail();
  }
}

const loading = ora("Being processed...").start();

if (process.argv.length === 2) {
  loading.text = "Expected one argument for id";
  loading.fail();
} else {
  const argument = process.argv[2];
  if (lowonganFile.lowongan.length > 0) {
    if (argument === "-l") {
      if (process.argv.length === 3) {
        ora("Expected one argument for txt file!").stop();
      } else {
        getDataByList(process.argv[3]);
      }
    } else {
      let isIdExist = Object.keys(lowonganFile.lowongan).some(
        (i) => lowonganFile.lowongan[i]["id"] === argument
      );
      if (isIdExist) {
        loading.text = "Id already exists";
        loading.fail();
      } else {
        getData(isIdExist);
      }
    }
  } else {
    if (argument === "-l") {
      if (process.argv.length === 3) {
        loading.text = "Expected one argument for txt file";
        loading.fail();
      } else {
        getDataByList(process.argv[3]);
      }
    } else {
      getData(argument);
    }
  }
}
