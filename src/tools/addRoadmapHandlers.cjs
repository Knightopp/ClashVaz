const fs = require('fs');
const path = require('path');

function addMissingRoadmapHandlers(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  const target = `      tbody.appendChild(tr);
      });
    }`;

  const replacement = `      tbody.appendChild(tr);
      });
    }

    function filterRoadmap(cat) {
      roadmapActiveCategory = cat;
      document.querySelectorAll('#roadmap-category-tabs .roadmap-tab').forEach(t => {
        if (t.dataset.cat === cat) t.classList.add('active');
        else t.classList.remove('active');
      });
      renderMaxingRoadmap(selectedCalcTargetTH);
    }

    function onRoadmapSearch(query) {
      roadmapSearchQuery = (query || '').toLowerCase().trim();
      renderMaxingRoadmap(selectedCalcTargetTH);
    }`;

  if (html.includes(target)) {
    html = html.replace(target, replacement);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Successfully added filterRoadmap and onRoadmapSearch to ${filePath}`);
  } else {
    console.warn(`Target not found in ${filePath}`);
  }
}

addMissingRoadmapHandlers(path.resolve(__dirname, '../../public/index.html'));
addMissingRoadmapHandlers(path.resolve(__dirname, '../../android/app/src/main/assets/www/index.html'));
